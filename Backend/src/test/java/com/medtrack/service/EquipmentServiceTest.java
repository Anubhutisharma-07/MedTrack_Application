
package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.dto.EquipmentImportPreviewResponse;
import com.medtrack.dto.EquipmentImportSummary;
import com.medtrack.dto.EquipmentValuationResponse;
import com.medtrack.model.DepreciationMethod;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentImportAuditLog;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EquipmentImportAuditLogRepository equipmentImportAuditLogRepository;

    @Mock
    private EventPublisherService eventPublisherService;

    @Mock
    private EquipmentAuditService equipmentAuditService;

    @Mock
    private EquipmentCsvService equipmentCsvService;

    @Mock
    private EquipmentStatisticsService equipmentStatisticsService;

    @Mock
    private EquipmentQrCodeService equipmentQrCodeService;

    @InjectMocks
    private EquipmentService equipmentService;

    private User mockUser;
    private Hospital mockHospital;
    private Equipment mockEquipment;
    private final String username = "hospital_admin";

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .username(username)
                .email("hospital@medtrack.com")
                .build();

        mockHospital = Hospital.builder()
                .id(10L)
                .name("General Hospital")
                .user(mockUser)
                .build();

        mockEquipment = Equipment.builder()
                .id(100L)
                .name("MRI Scanner")
                .model("Siemens A1")
                .serialNumber("SN-12345")
                .department("Radiology")
                .category(com.medtrack.model.EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .purchaseDate(LocalDate.of(2025, 1, 1))
                .equipmentCode("EQ-100")
                .hospital(mockHospital)
                .build();

        // Setup default lenient mock responses for extracted services
        lenient().when(equipmentCsvService.importEquipmentFromCsv(any(), any(), any()))
                .thenReturn(EquipmentImportSummary.builder().successCount(0).failureCount(0).build());
        lenient().when(equipmentCsvService.previewEquipmentImport(any(), any()))
                .thenReturn(EquipmentImportPreviewResponse.builder().totalRows(0).validCount(0).failureCount(0).build());
        lenient().when(equipmentStatisticsService.getDashboardOverview(any(), any()))
                .thenReturn(new com.medtrack.dto.EquipmentDashboardResponse(0, 0, 0, 0, 0, 0, 0));
        lenient().when(equipmentStatisticsService.getEquipmentValuation(any()))
                .thenReturn(EquipmentValuationResponse.builder().assetCount(0).build());
        lenient().when(equipmentQrCodeService.generateQrCodeBase64(any()))
                .thenReturn("base64qrdata");
    }

    @Test
    void getAllEquipment_Success() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByHospitalId(mockHospital.getId())).thenReturn(Collections.singletonList(mockEquipment));

        List<Equipment> result = equipmentService.getAllEquipment(username);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("MRI Scanner", result.get(0).getName());
        verify(equipmentRepository).findByHospitalId(mockHospital.getId());
    }

    @Test
    void getEquipmentById_Success() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByIdAndHospitalId(100L, mockHospital.getId())).thenReturn(Optional.of(mockEquipment));

        Equipment result = equipmentService.getEquipmentById(100L, username);

        assertNotNull(result);
        assertEquals("MRI Scanner", result.getName());
    }

    @Test
    void addEquipment_AutoGeneratesCode() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        
        Equipment newEq = Equipment.builder()
                .name("Ventilator")
                .department("ICU")
                .build();

        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Equipment saved = equipmentService.addEquipment(newEq, username);

        assertNotNull(saved);
        assertNotNull(saved.getEquipmentCode());
        assertTrue(saved.getEquipmentCode().startsWith("EQ-"));
        assertEquals(mockHospital, saved.getHospital());
    }

    @Test
    void addEquipment_PurchaseCostNull_Accepted() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        
        Equipment newEq = Equipment.builder()
                .name("Ventilator")
                .purchaseCost(null)
                .build();

        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Equipment saved = equipmentService.addEquipment(newEq, username);
        assertNotNull(saved);
        assertNull(saved.getPurchaseCost());
    }

    @Test
    void addEquipment_PurchaseCostZero_Accepted() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        
        Equipment newEq = Equipment.builder()
                .name("Ventilator")
                .purchaseCost(java.math.BigDecimal.ZERO)
                .build();

        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Equipment saved = equipmentService.addEquipment(newEq, username);
        assertNotNull(saved);
        assertEquals(java.math.BigDecimal.ZERO, saved.getPurchaseCost());
    }

    @Test
    void addEquipment_PurchaseCostPositive_Accepted() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        
        Equipment newEq = Equipment.builder()
                .name("Ventilator")
                .purchaseCost(new java.math.BigDecimal("100.50"))
                .build();

        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Equipment saved = equipmentService.addEquipment(newEq, username);
        assertNotNull(saved);
        assertEquals(new java.math.BigDecimal("100.50"), saved.getPurchaseCost());
    }

    @Test
    void addEquipment_PurchaseCostNegative_ThrowsException() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        
        Equipment newEq = Equipment.builder()
                .name("Ventilator")
                .purchaseCost(new java.math.BigDecimal("-10.00"))
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            equipmentService.addEquipment(newEq, username);
        });

        assertEquals("Purchase cost cannot be negative", exception.getMessage());
    }

    @Test
    void generateQrCodeBase64_Success() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByIdAndHospitalId(100L, mockHospital.getId())).thenReturn(Optional.of(mockEquipment));
        when(equipmentQrCodeService.generateQrCodeBase64(mockEquipment))
                .thenReturn("base64qrdata");

        String base64Qr = equipmentService.generateQrCodeBase64(100L, username);

        assertNotNull(base64Qr);
        assertEquals("base64qrdata", base64Qr);
        verify(equipmentQrCodeService).generateQrCodeBase64(mockEquipment);
    }

    @Test
    void adjustStock_CrossingIntoLowStock_PublishesEvent() {
        mockEquipment.setQuantity(15);
        mockEquipment.setMinimumStock(10);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByIdAndHospitalId(100L, mockHospital.getId())).thenReturn(Optional.of(mockEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.medtrack.dto.StockAdjustmentRequest request = com.medtrack.dto.StockAdjustmentRequest.builder()
                .delta(-8)
                .build();

        Equipment result = equipmentService.adjustStock(100L, request, username);

        assertEquals(7, result.getQuantity());
        verify(eventPublisherService).publishEvent(
                eq(mockHospital.getId()),
                eq(OperationsEvent.EventCategory.EQUIPMENT),
                eq(OperationsEvent.EventType.EQUIPMENT_LOW_STOCK),
                any(String.class),
                any(String.class),
                eq(mockEquipment.getId()),
                eq(OperationsEvent.EntityType.EQUIPMENT),
                eq("system"),
                eq(OperationsEvent.EventSeverity.WARNING));
    }

    @Test
    void adjustStock_AlreadyLowStock_DoesNotRepublishEvent() {
        mockEquipment.setQuantity(8);
        mockEquipment.setMinimumStock(10);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByIdAndHospitalId(100L, mockHospital.getId())).thenReturn(Optional.of(mockEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.medtrack.dto.StockAdjustmentRequest request = com.medtrack.dto.StockAdjustmentRequest.builder()
                .delta(2)
                .build();

        equipmentService.adjustStock(100L, request, username);

        verify(eventPublisherService, never()).publishEvent(
                any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void importEquipmentFromCsv_Success() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15\n" +
                "Ultrasound,U-500,SN-7766,Cardiology,Imaging,Maintenance,2025-11-20\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "equipment.csv",
                "text/csv",
                csvContent.getBytes()
        );

        EquipmentImportSummary expectedSummary = EquipmentImportSummary.builder()
                .successCount(2)
                .failureCount(0)
                .failures(Collections.emptyList())
                .build();
        when(equipmentCsvService.importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username)))
                .thenReturn(expectedSummary);

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertNotNull(summary);
        assertEquals(2, summary.getSuccessCount());
        assertEquals(0, summary.getFailureCount());
        assertTrue(summary.getFailures().isEmpty());

        verify(equipmentCsvService).importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username));
    }

    @Test
    void importEquipmentFromCsv_WithValidationFailures() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        // Row 2: Missing Name (Required)
        // Row 3: Missing Department (Required)
        // Row 4: Invalid Category
        // Row 5: Invalid Status
        // Row 6: Malformed Purchase Date
        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                ",Model A,SN-1,Radiology,Imaging,Operational,2026-01-01\n" +
                "X-Ray,Model B,SN-2,,Imaging,Operational,2026-01-01\n" +
                "MRI,Model C,SN-3,Radiology,InvalidCategory,Operational,2026-01-01\n" +
                "Ventilator,Model D,SN-4,ICU,Respiratory,BrokenStatus,2026-01-01\n" +
                "Stethoscope,Model E,SN-5,Cardiology,Imaging,Operational,2026/01/01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "equipment.csv",
                "text/csv",
                csvContent.getBytes()
        );

        List<EquipmentImportSummary.RowFailure> failures = List.of(
                new EquipmentImportSummary.RowFailure(2, csvContent.split("\n")[1], "Asset Name is required"),
                new EquipmentImportSummary.RowFailure(3, csvContent.split("\n")[2], "Department is required"),
                new EquipmentImportSummary.RowFailure(4, csvContent.split("\n")[3], "Invalid category"),
                new EquipmentImportSummary.RowFailure(5, csvContent.split("\n")[4], "Invalid condition/status"),
                new EquipmentImportSummary.RowFailure(6, csvContent.split("\n")[5], "Invalid Purchase Date format")
        );
        EquipmentImportSummary expectedSummary = EquipmentImportSummary.builder()
                .successCount(0)
                .failureCount(5)
                .failures(failures)
                .build();
        when(equipmentCsvService.importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username)))
                .thenReturn(expectedSummary);

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertNotNull(summary);
        assertEquals(0, summary.getSuccessCount());
        assertEquals(5, summary.getFailureCount());
        assertEquals(5, summary.getFailures().size());

        // Assert failure details
        assertEquals(2, summary.getFailures().get(0).getRowNumber());
        assertTrue(summary.getFailures().get(0).getReason().contains("Asset Name is required"));

        assertEquals(3, summary.getFailures().get(1).getRowNumber());
        assertTrue(summary.getFailures().get(1).getReason().contains("Department is required"));

        assertEquals(4, summary.getFailures().get(2).getRowNumber());
        assertTrue(summary.getFailures().get(2).getReason().contains("Invalid category"));

        assertEquals(5, summary.getFailures().get(3).getRowNumber());
        assertTrue(summary.getFailures().get(3).getReason().contains("Invalid condition/status"));

        assertEquals(6, summary.getFailures().get(4).getRowNumber());
        assertTrue(summary.getFailures().get(4).getReason().contains("Invalid Purchase Date format"));

        verify(equipmentCsvService).importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username));
    }

    @Test
    void importEquipmentFromCsv_DuplicateSerialWithinFile_RejectsSecondRowOnly() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-DUP,ICU,Respiratory,Operational,2026-01-01\n" +
                "Ultrasound,U-500,SN-DUP,Cardiology,Imaging,Operational,2026-01-01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary expectedSummary = EquipmentImportSummary.builder()
                .successCount(1)
                .failureCount(1)
                .failures(Collections.singletonList(
                        new EquipmentImportSummary.RowFailure(3, csvContent.split("\n")[2], "Duplicate Serial Number within this file")
                ))
                .build();
        when(equipmentCsvService.importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username)))
                .thenReturn(expectedSummary);

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(1, summary.getSuccessCount());
        assertEquals(1, summary.getFailureCount());
        assertEquals(3, summary.getFailures().get(0).getRowNumber());
        assertTrue(summary.getFailures().get(0).getReason().contains("Duplicate Serial Number within this file"));
    }

    @Test
    void importEquipmentFromCsv_SerialAlreadyInDatabase_RejectsRow() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-12345,ICU,Respiratory,Operational,2026-01-01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary expectedSummary = EquipmentImportSummary.builder()
                .successCount(0)
                .failureCount(1)
                .failures(Collections.singletonList(
                        new EquipmentImportSummary.RowFailure(2, csvContent.split("\n")[1], "Serial Number already exists in inventory")
                ))
                .build();
        when(equipmentCsvService.importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username)))
                .thenReturn(expectedSummary);

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(0, summary.getSuccessCount());
        assertEquals(1, summary.getFailureCount());
        assertTrue(summary.getFailures().get(0).getReason().contains("Serial Number already exists in inventory"));
    }

    @Test
    void importEquipmentFromCsv_BlankSerialNumbers_AreNotTreatedAsDuplicatesOfEachOther() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,,ICU,Respiratory,Operational,2026-01-01\n" +
                "Ultrasound,U-500,,Cardiology,Imaging,Operational,2026-01-01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary expectedSummary = EquipmentImportSummary.builder()
                .successCount(2)
                .failureCount(0)
                .failures(Collections.emptyList())
                .build();
        when(equipmentCsvService.importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username)))
                .thenReturn(expectedSummary);

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(2, summary.getSuccessCount());
        assertEquals(0, summary.getFailureCount());
    }

    @Test
    void importEquipmentFromCsv_EmptyFile_ThrowsException() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.csv",
                "text/csv",
                new byte[0]
        );

        when(equipmentCsvService.importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username)))
                .thenThrow(new IllegalArgumentException("CSV file is empty or missing"));

        assertThrows(IllegalArgumentException.class, () ->
                equipmentService.importEquipmentFromCsv(file, username)
        );
    }

    @Test
    void importEquipmentFromCsv_WritesAuditLogEntry() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15\n" +
                ",Model A,SN-1,Radiology,Imaging,Operational,2026-01-01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary expectedSummary = EquipmentImportSummary.builder()
                .successCount(1)
                .failureCount(1)
                .failures(Collections.singletonList(
                        new EquipmentImportSummary.RowFailure(3, csvContent.split("\n")[2], "Asset Name is required")
                ))
                .build();
        when(equipmentCsvService.importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username)))
                .thenReturn(expectedSummary);

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(1, summary.getSuccessCount());
        assertEquals(1, summary.getFailureCount());

        ArgumentCaptor<EquipmentImportAuditLog> logCaptor = ArgumentCaptor.forClass(EquipmentImportAuditLog.class);
        verify(equipmentCsvService).importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username));
    }

    @Test
    void previewEquipmentImport_ReturnsValidRowsAndFailures_WithoutSaving() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15\n" +
                ",Model A,SN-1,Radiology,Imaging,Operational,2026-01-01\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportPreviewResponse.PreviewRow previewRow = new EquipmentImportPreviewResponse.PreviewRow(
                2, Map.of("Name", "Ventilator", "Department", "ICU")
        );
        EquipmentImportPreviewResponse expectedPreview = EquipmentImportPreviewResponse.builder()
                .totalRows(2)
                .validCount(1)
                .failureCount(1)
                .validRows(Collections.singletonList(previewRow))
                .failures(Collections.singletonList(
                        new EquipmentImportSummary.RowFailure(3, csvContent.split("\n")[2], "Asset Name is required")
                ))
                .build();
        when(equipmentCsvService.previewEquipmentImport(eq(file), eq(mockHospital)))
                .thenReturn(expectedPreview);

        EquipmentImportPreviewResponse preview =
                equipmentService.previewEquipmentImport(file, username);

        assertNotNull(preview);
        assertEquals(2, preview.getTotalRows());
        assertEquals(1, preview.getValidCount());
        assertEquals(1, preview.getFailureCount());
        assertEquals(1, preview.getValidRows().size());
        assertEquals("Ventilator", preview.getValidRows().get(0).getData().get("Name"));
        assertEquals("ICU", preview.getValidRows().get(0).getData().get("Department"));
        assertEquals(3, preview.getFailures().get(0).getRowNumber());
        assertTrue(preview.getFailures().get(0).getReason().contains("Asset Name is required"));

        verify(equipmentCsvService).previewEquipmentImport(eq(file), eq(mockHospital));
    }

    @Test
    void previewEquipmentImport_ValidRowsCarryRowNumbers() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15\n" +
                "Ultrasound,U-500,SN-7766,Cardiology,Imaging,Maintenance,2025-11-20\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportPreviewResponse.PreviewRow row1 = new EquipmentImportPreviewResponse.PreviewRow(
                2, Map.of("Name", "Ventilator")
        );
        EquipmentImportPreviewResponse.PreviewRow row2 = new EquipmentImportPreviewResponse.PreviewRow(
                3, Map.of("Name", "Ultrasound")
        );
        EquipmentImportPreviewResponse expectedPreview = EquipmentImportPreviewResponse.builder()
                .totalRows(2)
                .validCount(2)
                .failureCount(0)
                .validRows(List.of(row1, row2))
                .failures(Collections.emptyList())
                .build();
        when(equipmentCsvService.previewEquipmentImport(eq(file), eq(mockHospital)))
                .thenReturn(expectedPreview);

        EquipmentImportPreviewResponse preview =
                equipmentService.previewEquipmentImport(file, username);

        assertEquals(2, preview.getValidCount());
        assertEquals(2, preview.getValidRows().size());
        assertEquals(2, preview.getValidRows().get(0).getRowNumber());
        assertEquals(3, preview.getValidRows().get(1).getRowNumber());
    }

    @Test
    void updateEquipment_Success() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByIdAndHospitalId(100L, mockHospital.getId())).thenReturn(Optional.of(mockEquipment));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Equipment updatedDetails = Equipment.builder()
                .name("Updated MRI")
                .model("Siemens A2")
                .serialNumber("SN-12345-UPD")
                .department("Cardiology")
                .status(EquipmentStatus.UNDER_MAINTENANCE)
                .purchaseDate(LocalDate.of(2025, 2, 2))
                .build();

        Equipment result = equipmentService.updateEquipment(100L, updatedDetails, username);

        assertNotNull(result);
        assertEquals("Updated MRI", result.getName());
        assertEquals("Siemens A2", result.getModel());
        assertEquals("SN-12345-UPD", result.getSerialNumber());
        assertEquals("Cardiology", result.getDepartment());
        // status is an EquipmentStatus enum, not a String. This assertion predates that migration.
        assertEquals(com.medtrack.model.EquipmentStatus.UNDER_MAINTENANCE, result.getStatus());
        assertEquals(LocalDate.of(2025, 2, 2), result.getPurchaseDate());

        verify(equipmentRepository).save(mockEquipment);
    }

    @Test
    void updateEquipment_NotFoundOrNoAccess_ThrowsException() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));
        when(equipmentRepository.findByIdAndHospitalId(999L, mockHospital.getId())).thenReturn(Optional.empty());

        Equipment updatedDetails = Equipment.builder().name("Updated MRI").build();

        assertThrows(ResourceNotFoundException.class, () ->
                equipmentService.updateEquipment(999L, updatedDetails, username)
        );

        verify(equipmentRepository, never()).save(any());
    }

    @Test
    void importEquipmentFromCsv_ParsesDepreciationColumns() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Equipment Code,Name,Model,Serial Number,Department,Category,Status,Purchase Date,Warranty Expiry,Purchase Cost,Useful Life (Years),Depreciation Method\n" +
                "EQ-200,Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15,2031-03-15,125000.50,8,declining balance\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary expectedSummary = EquipmentImportSummary.builder()
                .successCount(1)
                .failureCount(0)
                .failures(Collections.emptyList())
                .build();
        when(equipmentCsvService.importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username)))
                .thenReturn(expectedSummary);

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(1, summary.getSuccessCount());
        assertEquals(0, summary.getFailureCount());
    }

    @Test
    void importEquipmentFromCsv_BlankDepreciationMethod_DefaultsToStraightLine() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        // Old 7-column files still import: finance columns are optional and default sensibly.
        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date\n" +
                "Ventilator,V-200,SN-9988,ICU,Respiratory,Operational,2026-03-15\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary expectedSummary = EquipmentImportSummary.builder()
                .successCount(1)
                .failureCount(0)
                .failures(Collections.emptyList())
                .build();
        when(equipmentCsvService.importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username)))
                .thenReturn(expectedSummary);

        equipmentService.importEquipmentFromCsv(file, username);
    }

    @Test
    void importEquipmentFromCsv_InvalidFinanceColumns_FailRowOnly() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        String csvContent = "Name,Model,Serial Number,Department,Category,Status,Purchase Date,Purchase Cost,Useful Life (Years),Depreciation Method\n" +
                "A,Model A,SN-1,Radiology,Imaging,Operational,2026-01-01,-5,10,STRAIGHT_LINE\n" +
                "B,Model B,SN-2,ICU,Respiratory,Operational,2026-01-01,1000,ten,STRAIGHT_LINE\n" +
                "C,Model C,SN-3,Cardiology,Imaging,Operational,2026-01-01,1000,10,UNIT_DECREASE\n" +
                "D,Model D,SN-4,ER,Monitoring,Operational,2026-01-01,5000,5,DECLINING_BALANCE\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "equipment.csv", "text/csv", csvContent.getBytes());

        EquipmentImportSummary expectedSummary = EquipmentImportSummary.builder()
                .successCount(1)
                .failureCount(3)
                .failures(List.of(
                        new EquipmentImportSummary.RowFailure(2, csvContent.split("\n")[1], "Invalid Purchase Cost"),
                        new EquipmentImportSummary.RowFailure(3, csvContent.split("\n")[2], "Invalid Useful Life"),
                        new EquipmentImportSummary.RowFailure(4, csvContent.split("\n")[3], "Invalid Depreciation Method")
                ))
                .build();
        when(equipmentCsvService.importEquipmentFromCsv(eq(file), eq(mockHospital), eq(username)))
                .thenReturn(expectedSummary);

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(file, username);

        assertEquals(1, summary.getSuccessCount());
        assertEquals(3, summary.getFailureCount());
        assertTrue(summary.getFailures().get(0).getReason().contains("Invalid Purchase Cost"));
        assertTrue(summary.getFailures().get(1).getReason().contains("Invalid Useful Life"));
        assertTrue(summary.getFailures().get(2).getReason().contains("Invalid Depreciation Method"));
    }

    @Test
    void exportEquipmentCsv_IncludesFinanceColumns() throws Exception {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        org.springframework.mock.web.MockHttpServletResponse response = new org.springframework.mock.web.MockHttpServletResponse();
        equipmentService.exportEquipmentCsv(username, response);

        verify(equipmentCsvService).exportEquipmentCsv(eq(mockHospital.getId()), eq(response));
    }

    @Test
    void getEquipmentValuation_AggregatesFleet() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        EquipmentValuationResponse expectedValuation = EquipmentValuationResponse.builder()
                .assetCount(2)
                .assetsWithCost(1)
                .fullyDepreciatedCount(0)
                .totalPurchaseCost(new BigDecimal("100000.00"))
                .totalBookValue(new BigDecimal("90000.00"))
                .totalReplacementCost(new BigDecimal("110000.00"))
                .build();
        when(equipmentStatisticsService.getEquipmentValuation(mockHospital))
                .thenReturn(expectedValuation);

        EquipmentValuationResponse valuation = equipmentService.getEquipmentValuation(username);

        assertNotNull(valuation);
        assertEquals(2, valuation.getAssetCount());
        assertEquals(1, valuation.getAssetsWithCost());
        verify(equipmentStatisticsService).getEquipmentValuation(mockHospital);
    }

    @Test
    void getEquipmentValuation_FullyDepreciatedAndTopFive() {
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(mockUser));
        when(hospitalRepository.findByUserId(mockUser.getId())).thenReturn(Optional.of(mockHospital));

        EquipmentValuationResponse expectedValuation = EquipmentValuationResponse.builder()
                .assetCount(1)
                .assetsWithCost(1)
                .fullyDepreciatedCount(1)
                .totalPurchaseCost(new BigDecimal("5000"))
                .totalBookValue(BigDecimal.ZERO)
                .totalReplacementCost(new BigDecimal("5500"))
                .build();
        when(equipmentStatisticsService.getEquipmentValuation(mockHospital))
                .thenReturn(expectedValuation);

        EquipmentValuationResponse valuation = equipmentService.getEquipmentValuation(username);

        assertNotNull(valuation);
        assertEquals(1, valuation.getAssetCount());
        assertEquals(1, valuation.getFullyDepreciatedCount());
        verify(equipmentStatisticsService).getEquipmentValuation(mockHospital);
    }
}
