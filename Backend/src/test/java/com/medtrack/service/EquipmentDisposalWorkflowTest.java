package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.auth.service.KafkaEventPublisher;
import com.medtrack.dto.DataSanitizationRequest;
import com.medtrack.dto.EquipmentDisposalRequest;
import com.medtrack.dto.EquipmentDisposalResponse;
import com.medtrack.dto.MaintenanceWorkOrderRequest;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentDisposalMethod;
import com.medtrack.model.EquipmentDisposalStatus;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.MaintenanceWorkOrder;
import com.medtrack.model.MaintenanceWorkOrderPriority;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import com.medtrack.model.MaintenanceWorkOrderType;
import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.model.MaintenancePolicyStatus;
import com.medtrack.model.MaintenanceRuleScope;
import com.medtrack.model.RecurrenceFrequency;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenancePolicyRuleRepository;
import com.medtrack.repository.MaintenanceRuleAuditRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import com.medtrack.repository.MaintenanceWorkOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The retirement / disposal workflow end to end (issue #744): request with method and reason,
 * manager approval, data-sanitisation confirmation for devices that stored patient data, and
 * completion - which retires the asset, mints the certificate number and generates the PDF.
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "spring.datasource.url=jdbc:h2:mem:disposal-service-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
@DisplayName("equipment disposal workflow")
class EquipmentDisposalWorkflowTest {

    @MockitoBean
    private KafkaEventPublisher kafkaEventPublisher;

    @Autowired
    private EquipmentDisposalService disposalService;

    @Autowired
    private MaintenanceWorkOrderService workOrderService;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private MaintenanceWorkOrderRepository workOrderRepository;

    @Autowired
    private MaintenancePolicyRuleRepository ruleRepository;

    @Autowired
    private MaintenanceRuleAuditRepository ruleAuditRepository;

    @Autowired
    private MaintenanceTaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    private String username;
    private Hospital hospital;

    @BeforeEach
    void setUp() {
        username = "disposal-owner-" + UUID.randomUUID();

        User owner = userRepository.save(User.builder()
                .name("Disposal Owner")
                .username(username)
                .email(UUID.randomUUID() + "@medtrack.test")
                .password("irrelevant-but-at-least-six")
                .role("hospital")
                .phone("+1 (555) 000-0001")
                .organization("Disposal Trust")
                .accountStatus(AccountStatus.ACTIVE)
                .build());

        hospital = hospitalRepository.save(Hospital.builder()
                .name("Disposal Trust")
                .location("Test City")
                .user(owner)
                .build());
    }

    private Equipment liveAsset(String code) {
        return equipmentRepository.saveAndFlush(Equipment.builder()
                .equipmentCode(code)
                .name("Asset " + code)
                .department("Radiology")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .hospital(hospital)
                .build());
    }

    private EquipmentDisposalRequest request(EquipmentDisposalMethod method, boolean storesPatientData) {
        EquipmentDisposalRequest request = new EquipmentDisposalRequest();
        request.setDisposalMethod(method);
        request.setDisposalReason("End of useful life");
        request.setStoresPatientData(storesPatientData);
        return request;
    }

    @Test
    @DisplayName("a request starts pending approval with method and reason recorded")
    void requestCreatesPendingApprovalRecord() {
        Equipment asset = liveAsset("EQ-DISP-1");

        EquipmentDisposalResponse disposal =
                disposalService.requestDisposal(asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);

        assertEquals(EquipmentDisposalStatus.PENDING_APPROVAL, disposal.getStatus());
        assertEquals(EquipmentDisposalMethod.SCRAP, disposal.getDisposalMethod());
        assertEquals("End of useful life", disposal.getDisposalReason());
        assertEquals(username, disposal.getRequestedBy());
        assertEquals(asset.getId(), disposal.getEquipmentId());
    }

    @Test
    @DisplayName("a second open request for the same asset is rejected")
    void duplicateOpenRequestIsRejected() {
        Equipment asset = liveAsset("EQ-DISP-2");
        disposalService.requestDisposal(asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);

        assertThrows(IllegalArgumentException.class,
                () -> disposalService.requestDisposal(
                        asset.getId(), request(EquipmentDisposalMethod.SALE, false), username));
    }

    @Test
    @DisplayName("completing a data-bearing device without sanitisation confirmation is blocked")
    void completionRequiresDataSanitisationForDataBearingDevices() {
        Equipment asset = liveAsset("EQ-DISP-3");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, true), username);

        disposalService.approveDisposal(disposal.getId(), username);

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> disposalService.completeDisposal(disposal.getId(), username));
        assertTrue(error.getMessage().contains("Data sanitisation must be confirmed"));
    }

    @Test
    @DisplayName("approve, sanitise, complete retires the asset and mints the certificate")
    void fullWorkflowRetiresAssetAndMintsCertificate() {
        Equipment asset = liveAsset("EQ-DISP-4");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.DONATION, true), username);

        EquipmentDisposalResponse approved = disposalService.approveDisposal(disposal.getId(), username);
        assertEquals(EquipmentDisposalStatus.APPROVED, approved.getStatus());
        assertEquals(username, approved.getApprovedBy());
        assertNotNull(approved.getApprovedAt());

        DataSanitizationRequest sanitization = new DataSanitizationRequest();
        sanitization.setDetails("Drives removed and destroyed");
        EquipmentDisposalResponse sanitised =
                disposalService.recordDataSanitization(disposal.getId(), sanitization, username);
        assertTrue(sanitised.getDataSanitizationConfirmed());
        assertEquals(username, sanitised.getDataSanitizedBy());
        assertNotNull(sanitised.getDataSanitizedAt());

        EquipmentDisposalResponse completed = disposalService.completeDisposal(disposal.getId(), username);
        assertEquals(EquipmentDisposalStatus.COMPLETED, completed.getStatus());
        assertNotNull(completed.getCertificateNumber());
        assertTrue(completed.getCertificateNumber().startsWith("DSP-"));

        Equipment retired = equipmentRepository.findById(asset.getId()).orElseThrow();
        assertEquals(EquipmentStatus.DISPOSED, retired.getStatus(),
                "the asset must leave the active inventory once the disposal is completed");
    }

    @Test
    @DisplayName("an asset without stored data completes without the sanitisation step")
    void nonDataBearingDeviceCompletesDirectly() {
        Equipment asset = liveAsset("EQ-DISP-5");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.RETURN_TO_VENDOR, false), username);

        disposalService.approveDisposal(disposal.getId(), username);
        EquipmentDisposalResponse completed = disposalService.completeDisposal(disposal.getId(), username);

        assertEquals(EquipmentDisposalStatus.COMPLETED, completed.getStatus());
        assertEquals(EquipmentStatus.DISPOSED,
                equipmentRepository.findById(asset.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("the certificate of disposal is a real PDF generated for completed records only")
    void certificateIsGeneratedForCompletedRecords() {
        Equipment asset = liveAsset("EQ-DISP-6");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SALE, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        disposalService.completeDisposal(disposal.getId(), username);

        byte[] pdf = disposalService.generateCertificate(disposal.getId(), username);
        assertNotNull(pdf);
        assertTrue(pdf.length > 500, "the certificate must contain real PDF content");
        assertTrue(new String(pdf, java.nio.charset.StandardCharsets.ISO_8859_1).startsWith("%PDF"),
                "the certificate must be a PDF document");

        EquipmentDisposalResponse rejected = disposalService.requestDisposal(
                liveAsset("EQ-DISP-7").getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        assertThrows(IllegalStateException.class,
                () -> disposalService.generateCertificate(rejected.getId(), username),
                "a certificate must not exist before the disposal is completed");
    }

    @Test
    @DisplayName("retired and disposed assets appear in the retired view, not the active inventory")
    void retiredAssetsStaySearchableInTheRetiredView() {
        Equipment asset = liveAsset("EQ-DISP-8");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        disposalService.completeDisposal(disposal.getId(), username);

        Page<Equipment> retired = disposalService.getRetiredEquipment(username, PageRequest.of(0, 10));
        assertEquals(1, retired.getTotalElements());
        assertEquals(asset.getId(), retired.getContent().get(0).getId());
        assertFalse(retired.getContent().get(0).getDeleted(),
                "the full record must be preserved - never deleted");

        assertThrows(IllegalArgumentException.class,
                () -> disposalService.requestDisposal(
                        asset.getId(), request(EquipmentDisposalMethod.SALE, false), username),
                "a retired asset cannot be decommissioned again");
    }

    private MaintenanceWorkOrder workOrder(Equipment asset, String code, MaintenanceWorkOrderStatus status) {
        return workOrderRepository.saveAndFlush(MaintenanceWorkOrder.builder()
                .workOrderCode(code)
                .hospitalId(hospital.getId())
                .equipment(asset)
                .title("Outstanding work on " + asset.getEquipmentCode())
                .maintenanceType(MaintenanceWorkOrderType.CORRECTIVE)
                .priority(MaintenanceWorkOrderPriority.MEDIUM)
                .status(status)
                .dueDate(LocalDate.now().plusDays(2))
                .createdAt(LocalDateTime.now())
                .createdBy(username)
                .deleted(false)
                .build());
    }

    @Test
    @DisplayName("an asset with work still assigned to a technician cannot be decommissioned")
    void completionIsRefusedWhileWorkOrdersAreLive() {
        Equipment asset = liveAsset("EQ-DISP-WO-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        workOrder(asset, "WO-000801", MaintenanceWorkOrderStatus.IN_PROGRESS);

        IllegalArgumentException refused = assertThrows(IllegalArgumentException.class,
                () -> disposalService.completeDisposal(disposal.getId(), username));

        assertTrue(refused.getMessage().contains("WO-000801"),
                "The refusal has to name the work that is in the way: " + refused.getMessage());
        assertEquals(EquipmentStatus.ACTIVE,
                equipmentRepository.findById(asset.getId()).orElseThrow().getStatus(),
                "The asset stays in service while the work order is live");
    }

    @Test
    @DisplayName("every live work-order state blocks decommissioning")
    void everyLiveWorkOrderStateBlocksCompletion() {
        for (MaintenanceWorkOrderStatus status : List.of(
                MaintenanceWorkOrderStatus.OPEN,
                MaintenanceWorkOrderStatus.ASSIGNED,
                MaintenanceWorkOrderStatus.IN_PROGRESS,
                MaintenanceWorkOrderStatus.ON_HOLD)) {

            Equipment asset = liveAsset("EQ-DISP-WO-" + status.name());
            EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                    asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
            disposalService.approveDisposal(disposal.getId(), username);
            workOrder(asset, "WO-0009" + status.ordinal(), status);

            assertThrows(IllegalArgumentException.class,
                    () -> disposalService.completeDisposal(disposal.getId(), username),
                    status + " work must block decommissioning");
        }
    }

    @Test
    @DisplayName("work that is finished or cancelled does not block decommissioning")
    void settledWorkOrdersDoNotBlockCompletion() {
        Equipment asset = liveAsset("EQ-DISP-WO-2");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        workOrder(asset, "WO-000810", MaintenanceWorkOrderStatus.COMPLETED);
        workOrder(asset, "WO-000811", MaintenanceWorkOrderStatus.CANCELLED);

        EquipmentDisposalResponse completed = disposalService.completeDisposal(disposal.getId(), username);

        assertEquals(EquipmentDisposalStatus.COMPLETED, completed.getStatus());
        assertEquals(EquipmentStatus.DISPOSED,
                equipmentRepository.findById(asset.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("another asset's live work does not block this one")
    void workOnAnotherAssetDoesNotBlockCompletion() {
        Equipment asset = liveAsset("EQ-DISP-WO-3");
        Equipment neighbour = liveAsset("EQ-DISP-WO-4");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        workOrder(neighbour, "WO-000820", MaintenanceWorkOrderStatus.OPEN);

        assertEquals(EquipmentDisposalStatus.COMPLETED,
                disposalService.completeDisposal(disposal.getId(), username).getStatus());
    }

    private MaintenanceTask maintenanceTask(Equipment asset, String code, MaintenanceStatus status) {
        return taskRepository.saveAndFlush(MaintenanceTask.builder()
                .taskCode(code)
                .equipmentId(asset.getEquipmentCode())
                .equipment(asset.getName())
                .equipmentRecord(asset)
                .hospital("Disposal Trust")
                .hospitalId(hospital.getId())
                .maintenanceType("Preventive")
                .deadline(LocalDate.now().plusDays(5))
                .description("Scheduled preventive maintenance task")
                .priority("Normal")
                .status(status)
                .deleted(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Test
    @DisplayName("an asset with scheduled maintenance tasks remaining cannot be decommissioned")
    void completionIsRefusedWhilePreventiveMaintenanceTasksAreLive() {
        Equipment asset = liveAsset("EQ-DISP-TASK-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        maintenanceTask(asset, "PM-TASK-001", MaintenanceStatus.SCHEDULED);

        IllegalArgumentException refused = assertThrows(IllegalArgumentException.class,
                () -> disposalService.completeDisposal(disposal.getId(), username));

        assertTrue(refused.getMessage().contains("PM-TASK-001"),
                "The refusal message must specify the active task code: " + refused.getMessage());
        assertEquals(EquipmentStatus.ACTIVE,
                equipmentRepository.findById(asset.getId()).orElseThrow().getStatus(),
                "The asset status must remain active when scheduled tasks are outstanding");
    }

    @Test
    @DisplayName("every live maintenance task state blocks equipment decommissioning")
    void everyLiveTaskStatusBlocksCompletion() {
        for (MaintenanceStatus status : List.of(
                MaintenanceStatus.SCHEDULED,
                MaintenanceStatus.IN_PROGRESS,
                MaintenanceStatus.NEEDS_PART,
                MaintenanceStatus.ON_HOLD)) {

            Equipment asset = liveAsset("EQ-DISP-TSK-" + status.name());
            EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                    asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
            disposalService.approveDisposal(disposal.getId(), username);
            maintenanceTask(asset, "PM-TSK-00" + status.ordinal(), status);

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                    () -> disposalService.completeDisposal(disposal.getId(), username),
                    status + " task state must block equipment decommissioning");

            assertTrue(exception.getMessage().contains("PM-TSK-00" + status.ordinal()));
        }
    }

    @Test
    @DisplayName("completed maintenance tasks do not block equipment decommissioning")
    void completedTasksDoNotBlockDecommissioning() {
        Equipment asset = liveAsset("EQ-DISP-TASK-2");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        maintenanceTask(asset, "PM-TASK-100", MaintenanceStatus.COMPLETED);

        EquipmentDisposalResponse completed = disposalService.completeDisposal(disposal.getId(), username);

        assertEquals(EquipmentDisposalStatus.COMPLETED, completed.getStatus());
        assertEquals(EquipmentStatus.DISPOSED,
                equipmentRepository.findById(asset.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("active tasks on a different equipment record do not block this disposal")
    void taskOnAnotherAssetDoesNotBlockCompletion() {
        Equipment asset = liveAsset("EQ-DISP-TASK-3");
        Equipment neighbour = liveAsset("EQ-DISP-TASK-4");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        maintenanceTask(neighbour, "PM-TASK-200", MaintenanceStatus.SCHEDULED);

        assertEquals(EquipmentDisposalStatus.COMPLETED,
                disposalService.completeDisposal(disposal.getId(), username).getStatus());
    }

    @Test
    @DisplayName("both active work orders and active maintenance tasks block equipment decommissioning")
    void bothWorkOrdersAndTasksBlockDecommissioning() {
        Equipment asset = liveAsset("EQ-DISP-DUAL-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        workOrder(asset, "WO-DUAL-001", MaintenanceWorkOrderStatus.IN_PROGRESS);
        maintenanceTask(asset, "PM-DUAL-001", MaintenanceStatus.IN_PROGRESS);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> disposalService.completeDisposal(disposal.getId(), username));

        assertTrue(exception.getMessage().contains("WO-DUAL-001") || exception.getMessage().contains("PM-DUAL-001"),
                "Either outstanding work order or task must cause decommissioning refusal");
    }

    @Test
    @DisplayName("decommissioning exception explicitly formats multiple open task codes")
    void taskValidationMessageFormatsMultipleOpenTaskCodes() {
        Equipment asset = liveAsset("EQ-DISP-MULTI-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        maintenanceTask(asset, "PM-M-01", MaintenanceStatus.SCHEDULED);
        maintenanceTask(asset, "PM-M-02", MaintenanceStatus.NEEDS_PART);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> disposalService.completeDisposal(disposal.getId(), username));

        assertTrue(exception.getMessage().contains("PM-M-01"), "Error message should contain PM-M-01");
        assertTrue(exception.getMessage().contains("PM-M-02"), "Error message should contain PM-M-02");
    }

    @Test
    @DisplayName("soft deleted maintenance tasks do not block equipment decommissioning")
    void softDeletedTasksDoNotBlockDecommissioning() {
        Equipment asset = liveAsset("EQ-DISP-DEL-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);

        MaintenanceTask task = maintenanceTask(asset, "PM-DEL-01", MaintenanceStatus.SCHEDULED);
        task.setDeleted(true);
        task.setDeletedAt(LocalDateTime.now());
        task.setDeletedBy(username);
        taskRepository.saveAndFlush(task);

        EquipmentDisposalResponse completed = disposalService.completeDisposal(disposal.getId(), username);

        assertEquals(EquipmentDisposalStatus.COMPLETED, completed.getStatus());
        assertEquals(EquipmentStatus.DISPOSED,
                equipmentRepository.findById(asset.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("data sanitization can be recorded while tasks are pending but completion fails until tasks resolve")
    void dataSanitizationCanBeConfirmedPriorToTaskResolution() {
        Equipment asset = liveAsset("EQ-DISP-SAN-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.DONATION, true), username);
        disposalService.approveDisposal(disposal.getId(), username);

        DataSanitizationRequest sanitization = new DataSanitizationRequest();
        sanitization.setDetails("Patient data wiped from NVMe SSD");
        EquipmentDisposalResponse sanitised =
                disposalService.recordDataSanitization(disposal.getId(), sanitization, username);
        assertTrue(sanitised.getDataSanitizationConfirmed());

        MaintenanceTask activeTask = maintenanceTask(asset, "PM-SAN-01", MaintenanceStatus.IN_PROGRESS);

        assertThrows(IllegalArgumentException.class,
                () -> disposalService.completeDisposal(disposal.getId(), username),
                "Completion must fail while active tasks exist even if data sanitization is confirmed");

        activeTask.setStatus(MaintenanceStatus.COMPLETED);
        activeTask.setCompletedAt(LocalDateTime.now());
        taskRepository.saveAndFlush(activeTask);

        EquipmentDisposalResponse completed = disposalService.completeDisposal(disposal.getId(), username);
        assertEquals(EquipmentDisposalStatus.COMPLETED, completed.getStatus());
        assertEquals(EquipmentStatus.DISPOSED,
                equipmentRepository.findById(asset.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("task in NEEDS_PART state blocks equipment decommissioning")
    void taskInNeedsPartStateBlocksDecommissioning() {
        Equipment asset = liveAsset("EQ-DISP-PART-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);

        maintenanceTask(asset, "PM-PART-01", MaintenanceStatus.NEEDS_PART);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> disposalService.completeDisposal(disposal.getId(), username));

        assertTrue(exception.getMessage().contains("PM-PART-01"));
        assertEquals(EquipmentStatus.ACTIVE,
                equipmentRepository.findById(asset.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("task in ON_HOLD state blocks equipment decommissioning")
    void taskInOnHoldStateBlocksDecommissioning() {
        Equipment asset = liveAsset("EQ-DISP-HOLD-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);

        maintenanceTask(asset, "PM-HOLD-01", MaintenanceStatus.ON_HOLD);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> disposalService.completeDisposal(disposal.getId(), username));

        assertTrue(exception.getMessage().contains("PM-HOLD-01"));
        assertEquals(EquipmentStatus.ACTIVE,
                equipmentRepository.findById(asset.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("MaintenanceTaskRepository query returns only tasks matching hospital and equipment record")
    void repositoryQueryFiltersCorrectlyByHospitalAndEquipmentRecord() {
        Equipment asset = liveAsset("EQ-DISP-REPO-1");
        Equipment targetAsset = liveAsset("EQ-DISP-REPO-2");

        maintenanceTask(asset, "PM-REPO-01", MaintenanceStatus.SCHEDULED);
        MaintenanceTask targetTask = maintenanceTask(targetAsset, "PM-REPO-02", MaintenanceStatus.SCHEDULED);

        List<MaintenanceTask> tasks = taskRepository
                .findByHospitalIdAndEquipmentRecordId(hospital.getId(), targetAsset.getId());

        assertEquals(1, tasks.size());
        assertEquals(targetTask.getId(), tasks.get(0).getId());
        assertEquals("PM-REPO-02", tasks.get(0).getTaskCode());
    }

    @Test
    @DisplayName("completing decommissioning after resolving all active tasks succeeds and mints certificate")
    void completingDisposalAfterResolvingTasksSucceedsAndMintsCertificate() {
        Equipment asset = liveAsset("EQ-DISP-RESOLVE-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SALE, false), username);
        disposalService.approveDisposal(disposal.getId(), username);

        MaintenanceTask task1 = maintenanceTask(asset, "PM-RES-01", MaintenanceStatus.SCHEDULED);
        MaintenanceTask task2 = maintenanceTask(asset, "PM-RES-02", MaintenanceStatus.IN_PROGRESS);

        assertThrows(IllegalArgumentException.class,
                () -> disposalService.completeDisposal(disposal.getId(), username));

        task1.setStatus(MaintenanceStatus.COMPLETED);
        task1.setCompletedAt(LocalDateTime.now());
        task2.setStatus(MaintenanceStatus.COMPLETED);
        task2.setCompletedAt(LocalDateTime.now());
        taskRepository.saveAndFlush(task1);
        taskRepository.saveAndFlush(task2);

        EquipmentDisposalResponse completed = disposalService.completeDisposal(disposal.getId(), username);

        assertEquals(EquipmentDisposalStatus.COMPLETED, completed.getStatus());
        assertNotNull(completed.getCertificateNumber());
        assertTrue(completed.getCertificateNumber().startsWith("DSP-"));
        assertEquals(EquipmentStatus.DISPOSED,
                equipmentRepository.findById(asset.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("initiating a disposal request is refused while active work orders exist")
    void requestDisposalIsRefusedWhenActiveWorkOrdersExist() {
        Equipment asset = liveAsset("EQ-DISP-REQ-WO-1");
        workOrder(asset, "WO-REQ-001", MaintenanceWorkOrderStatus.IN_PROGRESS);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> disposalService.requestDisposal(
                        asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username));

        assertTrue(exception.getMessage().contains("WO-REQ-001"),
                "The refusal message must specify the active work order code");
    }

    @Test
    @DisplayName("initiating a disposal request is refused while scheduled maintenance tasks exist")
    void requestDisposalIsRefusedWhenScheduledTasksExist() {
        Equipment asset = liveAsset("EQ-DISP-REQ-TSK-1");
        maintenanceTask(asset, "PM-REQ-001", MaintenanceStatus.SCHEDULED);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> disposalService.requestDisposal(
                        asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username));

        assertTrue(exception.getMessage().contains("PM-REQ-001"),
                "The refusal message must specify the active task code");
    }

    @Test
    @DisplayName("work order creation is refused when equipment has a pending disposal request")
    void workOrderCreationIsRefusedWhenEquipmentHasPendingDisposal() {
        Equipment asset = liveAsset("EQ-DISP-WO-BLOCK-1");
        disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);

        MaintenanceWorkOrderRequest woReq = MaintenanceWorkOrderRequest.builder()
                .equipmentId(asset.getId())
                .title("New work order on pending disposal asset")
                .description("Routine check")
                .maintenanceType(MaintenanceWorkOrderType.CORRECTIVE)
                .priority(MaintenanceWorkOrderPriority.HIGH)
                .scheduledDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(3))
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> workOrderService.createWorkOrder(woReq, hospital.getId(), username));

        assertTrue(exception.getMessage().contains("active disposal request"),
                "Creation should be blocked when asset has pending disposal");
    }

    @Test
    @DisplayName("work order creation is refused when equipment has an approved disposal request")
    void workOrderCreationIsRefusedWhenEquipmentHasApprovedDisposal() {
        Equipment asset = liveAsset("EQ-DISP-WO-BLOCK-2");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SALE, false), username);
        disposalService.approveDisposal(disposal.getId(), username);

        MaintenanceWorkOrderRequest woReq = MaintenanceWorkOrderRequest.builder()
                .equipmentId(asset.getId())
                .title("New work order on approved disposal asset")
                .description("Pre-sale inspection")
                .maintenanceType(MaintenanceWorkOrderType.INSPECTION)
                .priority(MaintenanceWorkOrderPriority.MEDIUM)
                .scheduledDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(2))
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> workOrderService.createWorkOrder(woReq, hospital.getId(), username));

        assertTrue(exception.getMessage().contains("active disposal request"),
                "Creation should be blocked when asset has approved disposal");
    }

    @Test
    @DisplayName("rejecting a disposal request clears pending status allowing future requests")
    void rejectDisposalClearsPendingStatusAndAllowsSubsequentDisposal() {
        Equipment asset = liveAsset("EQ-DISP-REJ-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);

        EquipmentDisposalResponse rejected = disposalService.rejectDisposal(
                disposal.getId(), "Asset still needed in ICU", username);
        assertEquals(EquipmentDisposalStatus.REJECTED, rejected.getStatus());

        EquipmentDisposalResponse newDisposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.DONATION, false), username);
        assertNotNull(newDisposal.getId());
        assertEquals(EquipmentDisposalStatus.PENDING_APPROVAL, newDisposal.getStatus());
    }

    @Test
    @DisplayName("cancelling a disposal request clears pending status allowing future requests")
    void cancelDisposalClearsPendingStatusAndAllowsSubsequentDisposal() {
        Equipment asset = liveAsset("EQ-DISP-CANCEL-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SALE, false), username);

        EquipmentDisposalResponse cancelled = disposalService.cancelDisposal(disposal.getId(), username);
        assertEquals(EquipmentDisposalStatus.CANCELLED, cancelled.getStatus());

        EquipmentDisposalResponse newDisposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.RETURN_TO_VENDOR, false), username);
        assertNotNull(newDisposal.getId());
        assertEquals(EquipmentDisposalStatus.PENDING_APPROVAL, newDisposal.getStatus());
    }

    @Test
    @DisplayName("disposal history returns records in descending order for hospital")
    void disposalHistoryReturnsRecordsInDescendantOrderWithTenantIsolation() {
        Equipment asset1 = liveAsset("EQ-DISP-HIST-1");
        Equipment asset2 = liveAsset("EQ-DISP-HIST-2");

        disposalService.requestDisposal(asset1.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.requestDisposal(asset2.getId(), request(EquipmentDisposalMethod.SALE, false), username);

        List<EquipmentDisposalResponse> history = disposalService.getDisposalHistory(username);
        assertEquals(2, history.size());
        assertTrue(history.get(0).getRequestedAt().isAfter(history.get(1).getRequestedAt())
                || history.get(0).getRequestedAt().isEqual(history.get(1).getRequestedAt()));
    }

    @Test
    @DisplayName("pending disposals listing returns only pending approval items")
    void pendingDisposalsReturnsOnlyPendingApprovalItems() {
        Equipment asset1 = liveAsset("EQ-DISP-PEND-1");
        Equipment asset2 = liveAsset("EQ-DISP-PEND-2");

        EquipmentDisposalResponse disp1 = disposalService.requestDisposal(
                asset1.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        EquipmentDisposalResponse disp2 = disposalService.requestDisposal(
                asset2.getId(), request(EquipmentDisposalMethod.SALE, false), username);

        disposalService.approveDisposal(disp1.getId(), username);

        List<EquipmentDisposalResponse> pending = disposalService.getPendingDisposals(username);
        assertEquals(1, pending.size());
        assertEquals(disp2.getId(), pending.get(0).getId());
    }

    @Test
    @DisplayName("requestDisposal throws exception when disposal method is missing")
    void requestDisposalValidatesDisposalMethodPresence() {
        Equipment asset = liveAsset("EQ-DISP-VAL-1");
        EquipmentDisposalRequest invalidReq = new EquipmentDisposalRequest();
        invalidReq.setDisposalReason("Reason without method");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> disposalService.requestDisposal(asset.getId(), invalidReq, username));

        assertEquals("Disposal method is required", exception.getMessage());
    }

    @Test
    @DisplayName("getDisposalsForEquipment returns history scoped to asset and hospital")
    void getDisposalsForEquipmentScopesToAssetAndHospital() {
        Equipment asset1 = liveAsset("EQ-DISP-SCOPE-1");
        Equipment asset2 = liveAsset("EQ-DISP-SCOPE-2");

        EquipmentDisposalResponse disp1 = disposalService.requestDisposal(
                asset1.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.requestDisposal(
                asset2.getId(), request(EquipmentDisposalMethod.SALE, false), username);

        List<EquipmentDisposalResponse> asset1History =
                disposalService.getDisposalsForEquipment(asset1.getId(), username);

        assertEquals(1, asset1History.size());
        assertEquals(disp1.getId(), asset1History.get(0).getId());
        assertEquals(asset1.getId(), asset1History.get(0).getEquipmentId());
    }

    @Test
    @DisplayName("approveDisposal throws exception when status is not PENDING_APPROVAL")
    void approveDisposalRejectsNonPendingDisposals() {
        Equipment asset = liveAsset("EQ-DISP-APP-ERR-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);

        disposalService.approveDisposal(disposal.getId(), username);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> disposalService.approveDisposal(disposal.getId(), username));

        assertTrue(exception.getMessage().contains("Disposal must be PENDING_APPROVAL to continue"));
    }

    @Test
    @DisplayName("rejectDisposal records rejection reason and stamps audit metadata")
    void rejectDisposalRecordsReasonAndAuditMetadata() {
        Equipment asset = liveAsset("EQ-DISP-REJ-META-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.DONATION, false), username);

        EquipmentDisposalResponse rejected = disposalService.rejectDisposal(
                disposal.getId(), "Asset still required in Emergency ward", username);

        assertEquals(EquipmentDisposalStatus.REJECTED, rejected.getStatus());
        assertEquals("Asset still required in Emergency ward", rejected.getRejectedReason());
        assertEquals(username, rejected.getRejectedBy());
        assertNotNull(rejected.getRejectedAt());
    }

    @Test
    @DisplayName("cancelDisposal stamps cancellation audit metadata")
    void cancelDisposalStampsAuditMetadata() {
        Equipment asset = liveAsset("EQ-DISP-CNCL-META-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SALE, false), username);

        EquipmentDisposalResponse cancelled = disposalService.cancelDisposal(disposal.getId(), username);

        assertEquals(EquipmentDisposalStatus.CANCELLED, cancelled.getStatus());
        assertEquals(username, cancelled.getCancelledBy());
        assertNotNull(cancelled.getCancelledAt());
    }

    @Test
    @DisplayName("recordDataSanitization updates sanitization notes and actor metadata")
    void recordDataSanitizationUpdatesDetailsAndActorMetadata() {
        Equipment asset = liveAsset("EQ-DISP-SAN-META-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, true), username);

        disposalService.approveDisposal(disposal.getId(), username);

        DataSanitizationRequest sanitizationRequest = new DataSanitizationRequest();
        sanitizationRequest.setDetails("SSD DoD 5220.22-M 7-pass wipe performed");

        EquipmentDisposalResponse sanitised = disposalService.recordDataSanitization(
                disposal.getId(), sanitizationRequest, username);

        assertTrue(sanitised.getDataSanitizationConfirmed());
        assertEquals("SSD DoD 5220.22-M 7-pass wipe performed", sanitised.getDataSanitizationDetails());
        assertEquals(username, sanitised.getDataSanitizedBy());
        assertNotNull(sanitised.getDataSanitizedAt());
    }

    @Test
    @DisplayName("workOrderService rejects work order creation for retired or disposed equipment")
    void workOrderServiceRejectsWorkOrderCreationForDisposedEquipment() {
        Equipment asset = liveAsset("EQ-DISP-WO-DISPOSED-1");
        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        disposalService.completeDisposal(disposal.getId(), username);

        MaintenanceWorkOrderRequest woReq = MaintenanceWorkOrderRequest.builder()
                .equipmentId(asset.getId())
                .title("Work order on disposed asset")
                .description("Check status")
                .maintenanceType(MaintenanceWorkOrderType.CORRECTIVE)
                .priority(MaintenanceWorkOrderPriority.HIGH)
                .scheduledDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(2))
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> workOrderService.createWorkOrder(woReq, hospital.getId(), username));

        assertTrue(exception.getMessage().contains("disposed"),
                "Work order creation must be rejected for disposed equipment");
    }

    @Test
    @DisplayName("completeDisposal automatically deactivates active individual maintenance rules and logs audit trail")
    void completeDisposal_DeactivatesAssociatedIndividualMaintenanceRulesAndLogsAudit() {
        Equipment asset = liveAsset("EQ-RULE-DEACT-1");

        MaintenancePolicyRule rule = ruleRepository.save(MaintenancePolicyRule.builder()
                .hospitalId(hospital.getId())
                .policyCode("POL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .name("Calibration Rule for " + asset.getEquipmentCode())
                .description("Automatic recurring calibration")
                .ruleScope(MaintenanceRuleScope.INDIVIDUAL_EQUIPMENT)
                .equipmentRecordId(asset.getId())
                .priority("High")
                .frequency(RecurrenceFrequency.MONTHLY)
                .maintenanceType("Preventive Calibration")
                .startDate(LocalDate.now())
                .active(true)
                .status(MaintenancePolicyStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);

        disposalService.completeDisposal(disposal.getId(), username);

        MaintenancePolicyRule updatedRule = ruleRepository.findById(rule.getId()).orElseThrow();
        assertFalse(updatedRule.getActive(), "Rule must be marked inactive after equipment disposal");
        assertEquals(MaintenancePolicyStatus.ARCHIVED, updatedRule.getStatus(), "Rule status must be ARCHIVED");

        boolean auditLogged = ruleAuditRepository.findByHospitalIdAndRuleIdOrderByCreatedAtDesc(hospital.getId(), rule.getId()).stream()
                .anyMatch(audit -> audit.getAction() == com.medtrack.model.MaintenanceRuleAuditAction.DEACTIVATED);
        assertTrue(auditLogged, "Rule deactivation audit entry must be saved in rule audit repository");
    }

    @Test
    @DisplayName("completeDisposal deactivates multiple individual rules bound to the same asset without affecting other assets")
    void completeDisposal_WhenMultipleRulesExist_DeactivatesAllMatchingIndividualRules() {
        Equipment asset1 = liveAsset("EQ-RULE-DEACT-MULTI-1");
        Equipment asset2 = liveAsset("EQ-RULE-DEACT-MULTI-2");

        MaintenancePolicyRule rule1 = ruleRepository.save(MaintenancePolicyRule.builder()
                .hospitalId(hospital.getId())
                .policyCode("POL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .name("Rule 1 for Asset 1")
                .ruleScope(MaintenanceRuleScope.INDIVIDUAL_EQUIPMENT)
                .equipmentRecordId(asset1.getId())
                .frequency(RecurrenceFrequency.MONTHLY)
                .maintenanceType("Inspection")
                .startDate(LocalDate.now())
                .active(true)
                .status(MaintenancePolicyStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        MaintenancePolicyRule rule2 = ruleRepository.save(MaintenancePolicyRule.builder()
                .hospitalId(hospital.getId())
                .policyCode("POL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .name("Rule 2 for Asset 1")
                .ruleScope(MaintenanceRuleScope.INDIVIDUAL_EQUIPMENT)
                .equipmentRecordId(asset1.getId())
                .frequency(RecurrenceFrequency.QUARTERLY)
                .maintenanceType("Safety Test")
                .startDate(LocalDate.now())
                .active(true)
                .status(MaintenancePolicyStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        MaintenancePolicyRule ruleOtherAsset = ruleRepository.save(MaintenancePolicyRule.builder()
                .hospitalId(hospital.getId())
                .policyCode("POL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .name("Rule for Asset 2")
                .ruleScope(MaintenanceRuleScope.INDIVIDUAL_EQUIPMENT)
                .equipmentRecordId(asset2.getId())
                .frequency(RecurrenceFrequency.MONTHLY)
                .maintenanceType("Inspection")
                .startDate(LocalDate.now())
                .active(true)
                .status(MaintenancePolicyStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());

        EquipmentDisposalResponse disposal = disposalService.requestDisposal(
                asset1.getId(), request(EquipmentDisposalMethod.SCRAP, false), username);
        disposalService.approveDisposal(disposal.getId(), username);
        disposalService.completeDisposal(disposal.getId(), username);

        assertFalse(ruleRepository.findById(rule1.getId()).orElseThrow().getActive());
        assertFalse(ruleRepository.findById(rule2.getId()).orElseThrow().getActive());
        assertTrue(ruleRepository.findById(ruleOtherAsset.getId()).orElseThrow().getActive(),
                "Rule for active asset 2 must remain active");
    }
}
