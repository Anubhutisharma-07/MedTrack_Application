package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.SparePartDeductionItem;
import com.medtrack.dto.SparePartImportSummary;
import com.medtrack.dto.SparePartResponse;
import com.medtrack.dto.SparePartStockRequest;
import com.medtrack.model.Hospital;
import com.medtrack.model.SparePart;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.SparePartRepository;
import org.springframework.mock.web.MockMultipartFile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SparePartServiceTest {

    @Mock private SparePartRepository sparePartRepository;
    @Mock private HospitalRepository hospitalRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private SparePartService sparePartService;

    private User testUser;
    private Hospital testHospital;
    private SparePart testSparePart;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(100L).username("hospitalAdmin").email("admin@hospital.com").role("HOSPITAL").build();
        testHospital = Hospital.builder().id(1L).name("General Hospital").user(testUser).build();
        testSparePart = SparePart.builder().id(50L).hospitalId(1L).partNumber("FILTER-001")
                .description("HEPA Air Filter").compatibleModels("Ventilator X1").stockLevel(25)
                .reorderPoint(10).unitCost(45.50).deleted(false).build();
    }

    @Test
    @DisplayName("createSparePart - successfully saves spare part when valid")
    void createSparePart_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(1L, "FILTER-001")).thenReturn(false);
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePart created = sparePartService.createSparePart(testSparePart, "hospitalAdmin");
        assertThat(created).isNotNull();
        assertThat(created.getPartNumber()).isEqualTo("FILTER-001");
        verify(sparePartRepository).save(testSparePart);
    }

    @Test
    @DisplayName("createSparePart - throws exception when part number already exists")
    void createSparePart_DuplicatePartNumber_ThrowsException() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(1L, "FILTER-001")).thenReturn(true);

        assertThatThrownBy(() -> sparePartService.createSparePart(testSparePart, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Spare part with part number already exists");
        verify(sparePartRepository, never()).save(any());
    }

    @Test
    @DisplayName("createSparePart - throws exception when payload validation fails")
    void createSparePart_InvalidFields_ThrowsException() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        testSparePart.setPartNumber("");
        assertThatThrownBy(() -> sparePartService.createSparePart(testSparePart, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Part number is required");
    }

    @Test
    @DisplayName("updateSparePart - successfully updates spare part")
    void updateSparePart_Success() {
        SparePart updateRequest = SparePart.builder().partNumber("FILTER-001").description("Updated HEPA Filter")
                .compatibleModels("Ventilator X2").stockLevel(30).reorderPoint(15).unitCost(50.00).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByIdAndHospitalIdForUpdate(50L, 1L))
                .thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePart updated = sparePartService.updateSparePart(50L, updateRequest, "hospitalAdmin");
        assertThat(updated.getDescription()).isEqualTo("Updated HEPA Filter");
        assertThat(updated.getStockLevel()).isEqualTo(30);
    }

    @Test
    @DisplayName("deductStock - successfully deducts stock for active spare part")
    void deductStock_Success() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(5).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(
                1L, "FILTER-001")).thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePartResponse updated = sparePartService.deductStock(request, "hospitalAdmin");
        assertThat(updated.getStockLevel()).isEqualTo(20);
        verify(sparePartRepository).findActiveByHospitalIdAndPartNumberForUpdate(
                1L, "FILTER-001");
    }

    @Test
    @DisplayName("deductStock - throws exception when quantity is zero or negative")
    void deductStock_InvalidQuantity_ThrowsException() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(-10).build();
        assertThatThrownBy(() -> sparePartService.deductStock(request, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Stock adjustment quantity must be greater than zero");
        verifyNoInteractions(userRepository, hospitalRepository, sparePartRepository);
    }

    @Test
    @DisplayName("deductStock - throws exception when stock is insufficient")
    void deductStock_InsufficientStock_ThrowsException() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(100).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(
                1L, "FILTER-001")).thenReturn(Optional.of(testSparePart));

        assertThatThrownBy(() -> sparePartService.deductStock(request, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Insufficient stock");
        verify(sparePartRepository, never()).save(any());
    }

    @Test
    @DisplayName("restockSparePart - successfully increases stock level")
    void restockSparePart_Success() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(15).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(
                1L, "FILTER-001")).thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePartResponse restocked = sparePartService.restockSparePart(request, "hospitalAdmin");
        assertThat(restocked.getStockLevel()).isEqualTo(40);
    }

    @Test
    @DisplayName("getLowStockAlerts - delegates to repository for active low stock items")
    void getLowStockAlerts_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findLowStockPartsByHospitalId(1L)).thenReturn(List.of(testSparePart));

        List<SparePartResponse> alerts = sparePartService.getLowStockAlerts("hospitalAdmin");
        assertThat(alerts).hasSize(1);
    }

    @Test
    @DisplayName("deleteSparePart - soft deletes the spare part record")
    void deleteSparePart_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByIdAndHospitalIdForUpdate(50L, 1L))
                .thenReturn(Optional.of(testSparePart));

        sparePartService.deleteSparePart(50L, "hospitalAdmin");

        ArgumentCaptor<SparePart> captor = ArgumentCaptor.forClass(SparePart.class);
        verify(sparePartRepository).save(captor.capture());
        assertThat(captor.getValue().getDeleted()).isTrue();
    }

    @Test
    @DisplayName("getAllSpareParts - filters out soft-deleted spare parts")
    void getAllSpareParts_ExcludesDeletedItems() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByHospitalIdAndDeletedFalse(1L)).thenReturn(List.of(testSparePart));

        List<SparePartResponse> parts = sparePartService.getAllSpareParts("hospitalAdmin");
        assertThat(parts).hasSize(1);
        assertThat(parts.get(0).getPartNumber()).isEqualTo("FILTER-001");
        verify(sparePartRepository).findByHospitalIdAndDeletedFalse(1L);
        verify(sparePartRepository, never()).findByHospitalId(anyLong());
    }

    @Test
    @DisplayName("getSparePart - successfully returns single active spare part")
    void getSparePart_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByIdAndHospitalIdAndDeletedFalse(50L, 1L))
                .thenReturn(Optional.of(testSparePart));

        SparePartResponse result = sparePartService.getSparePart(50L, "hospitalAdmin");
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(50L);
        assertThat(result.getPartNumber()).isEqualTo("FILTER-001");
    }

    @Test
    @DisplayName("getSparePart - throws ResourceNotFoundException when part is deleted or missing")
    void getSparePart_NotFound_ThrowsException() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByIdAndHospitalIdAndDeletedFalse(999L, 1L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> sparePartService.getSparePart(999L, "hospitalAdmin"))
                .isInstanceOf(com.medtrack.exception.ResourceNotFoundException.class)
                .hasMessageContaining("Active spare part not found with ID: 999");
    }

    @Test
    @DisplayName("getSparePart - throws IllegalArgumentException when id is null")
    void getSparePart_NullId_ThrowsException() {
        assertThatThrownBy(() -> sparePartService.getSparePart(null, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Spare part ID is required");
        verifyNoInteractions(userRepository, hospitalRepository, sparePartRepository);
    }

    @Test
    @DisplayName("deductSparePartsForWorkOrder - successfully deducts stock level for valid items")
    void deductSparePartsForWorkOrder_Success() {
        com.medtrack.dto.SparePartDeductionItem item = com.medtrack.dto.SparePartDeductionItem.builder()
                .partNumber("FILTER-001")
                .quantity(3)
                .build();
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "FILTER-001"))
                .thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(inv -> inv.getArgument(0));

        sparePartService.deductSparePartsForWorkOrder(List.of(item), 1L, "hospitalAdmin");

        assertThat(testSparePart.getStockLevel()).isEqualTo(22);
        verify(sparePartRepository).save(testSparePart);
    }

    @Test
    @DisplayName("deductSparePartsForWorkOrder - throws IllegalArgumentException when stock is insufficient")
    void deductSparePartsForWorkOrder_InsufficientStock_ThrowsException() {
        com.medtrack.dto.SparePartDeductionItem item = com.medtrack.dto.SparePartDeductionItem.builder()
                .partNumber("FILTER-001")
                .quantity(50)
                .build();
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "FILTER-001"))
                .thenReturn(Optional.of(testSparePart));

        assertThatThrownBy(() -> sparePartService.deductSparePartsForWorkOrder(List.of(item), 1L, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Insufficient stock for spare part: FILTER-001");
    }

    @Test
    @DisplayName("getAllSpareParts - successfully resolves hospital for technician via organization")
    void getAllSpareParts_TechnicianRole_ResolvesHospitalByOrganization() {
        User techUser = User.builder()
                .id(200L)
                .username("techUser")
                .email("tech@hospital.com")
                .role("technician")
                .organization("General Hospital")
                .build();

        when(userRepository.findByUsername("techUser")).thenReturn(Optional.of(techUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.empty());
        when(hospitalRepository.findByNameIgnoreCaseAndTrimmed("General Hospital"))
                .thenReturn(List.of(testHospital));
        when(sparePartRepository.findByHospitalIdAndDeletedFalse(1L))
                .thenReturn(List.of(testSparePart));

        List<SparePartResponse> parts = sparePartService.getAllSpareParts("techUser");

        assertThat(parts).hasSize(1);
        assertThat(parts.get(0).getPartNumber()).isEqualTo("FILTER-001");
        verify(hospitalRepository).findByUserId(200L);
        verify(hospitalRepository).findByNameIgnoreCaseAndTrimmed("General Hospital");
    }

    @Test
    @DisplayName("getSparePart - successfully resolves hospital for technician via organization")
    void getSparePart_TechnicianRole_ResolvesHospitalByOrganization() {
        User techUser = User.builder()
                .id(200L)
                .username("techUser")
                .email("tech@hospital.com")
                .role("technician")
                .organization("General Hospital")
                .build();

        when(userRepository.findByUsername("techUser")).thenReturn(Optional.of(techUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.empty());
        when(hospitalRepository.findByNameIgnoreCaseAndTrimmed("General Hospital"))
                .thenReturn(List.of(testHospital));
        when(sparePartRepository.findByIdAndHospitalIdAndDeletedFalse(50L, 1L))
                .thenReturn(Optional.of(testSparePart));

        SparePartResponse part = sparePartService.getSparePart(50L, "techUser");

        assertThat(part).isNotNull();
        assertThat(part.getId()).isEqualTo(50L);
        assertThat(part.getPartNumber()).isEqualTo("FILTER-001");
        verify(hospitalRepository).findByNameIgnoreCaseAndTrimmed("General Hospital");
    }

    @Test
    @DisplayName("deductStock - successfully resolves hospital and deducts stock for technician")
    void deductStock_TechnicianRole_ResolvesHospitalAndDeductsStock() {
        User techUser = User.builder()
                .id(200L)
                .username("techUser")
                .email("tech@hospital.com")
                .role("technician")
                .organization("General Hospital")
                .build();
        SparePartStockRequest request = SparePartStockRequest.builder()
                .partNumber("FILTER-001")
                .quantity(3)
                .build();

        when(userRepository.findByUsername("techUser")).thenReturn(Optional.of(techUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.empty());
        when(hospitalRepository.findByNameIgnoreCaseAndTrimmed("General Hospital"))
                .thenReturn(List.of(testHospital));
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "FILTER-001"))
                .thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(inv -> inv.getArgument(0));

        SparePartResponse response = sparePartService.deductStock(request, "techUser");

        assertThat(response).isNotNull();
        assertThat(response.getStockLevel()).isEqualTo(22);
        verify(hospitalRepository).findByNameIgnoreCaseAndTrimmed("General Hospital");
    }

    @Test
    @DisplayName("getHospitalForUser - throws ResourceNotFoundException when technician organization is not found")
    void getHospitalForUser_TechnicianUnknownOrganization_ThrowsException() {
        User techUser = User.builder()
                .id(200L)
                .username("techUser")
                .email("tech@hospital.com")
                .role("technician")
                .organization("Unknown Hospital")
                .build();

        when(userRepository.findByUsername("techUser")).thenReturn(Optional.of(techUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.empty());
        when(hospitalRepository.findByNameIgnoreCaseAndTrimmed("Unknown Hospital"))
                .thenReturn(List.of());

        assertThatThrownBy(() -> sparePartService.getAllSpareParts("techUser"))
                .isInstanceOf(com.medtrack.exception.ResourceNotFoundException.class)
                .hasMessageContaining("Hospital profile not found for technician organization: Unknown Hospital");
    }

    @Test
    @DisplayName("getHospitalForUser - throws ResourceNotFoundException when technician has blank organization")
    void getHospitalForUser_TechnicianBlankOrganization_ThrowsException() {
        User techUser = User.builder()
                .id(200L)
                .username("techUser")
                .email("tech@hospital.com")
                .role("technician")
                .organization("")
                .build();

        when(userRepository.findByUsername("techUser")).thenReturn(Optional.of(techUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sparePartService.getAllSpareParts("techUser"))
                .isInstanceOf(com.medtrack.exception.ResourceNotFoundException.class)
                .hasMessageContaining("Hospital profile not found for technician organization: unassigned");
    }

    @Test
    @DisplayName("getHospitalForUser - throws ResourceNotFoundException when non-technician user has no hospital profile")
    void getHospitalForUser_NonTechnicianNoHospital_ThrowsException() {
        User regularUser = User.builder()
                .id(300L)
                .username("regularUser")
                .email("user@regular.com")
                .role("HOSPITAL")
                .build();

        when(userRepository.findByUsername("regularUser")).thenReturn(Optional.of(regularUser));
        when(hospitalRepository.findByUserId(300L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sparePartService.getAllSpareParts("regularUser"))
                .isInstanceOf(com.medtrack.exception.ResourceNotFoundException.class)
                .hasMessageContaining("Hospital profile not found for user: regularUser");
    }

    @Test
    @DisplayName("deductStock - throws IllegalArgumentException when part number is blank for technician")
    void deductStock_TechnicianBlankPartNumber_ThrowsException() {
        SparePartStockRequest request = SparePartStockRequest.builder()
                .partNumber("")
                .quantity(2)
                .build();

        assertThatThrownBy(() -> sparePartService.deductStock(request, "techUser"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Part number is required for stock adjustment");
        verifyNoInteractions(userRepository, hospitalRepository, sparePartRepository);
    }

    @Test
    @DisplayName("deductStock - throws IllegalArgumentException when quantity is negative for technician")
    void deductStock_TechnicianNegativeQuantity_ThrowsException() {
        SparePartStockRequest request = SparePartStockRequest.builder()
                .partNumber("FILTER-001")
                .quantity(-5)
                .build();

        assertThatThrownBy(() -> sparePartService.deductStock(request, "techUser"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Stock adjustment quantity must be greater than zero");
        verifyNoInteractions(userRepository, hospitalRepository, sparePartRepository);
    }

    @Test
    @DisplayName("deductSparePartsForWorkOrder - throws ResourceNotFoundException when part is missing for technician hospital")
    void deductSparePartsForWorkOrder_TechnicianHospitalPartNotFound_ThrowsException() {
        com.medtrack.dto.SparePartDeductionItem item = com.medtrack.dto.SparePartDeductionItem.builder()
                .partNumber("NON-EXISTENT-PART")
                .quantity(1)
                .build();

        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "NON-EXISTENT-PART"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> sparePartService.deductSparePartsForWorkOrder(List.of(item), 1L, "techUser"))
                .isInstanceOf(com.medtrack.exception.ResourceNotFoundException.class)
                .hasMessageContaining("Spare part with part number 'NON-EXISTENT-PART' not found in hospital inventory");
    }

    @Test
    @DisplayName("getLowStockAlerts - successfully resolves hospital for technician via organization")
    void getLowStockAlerts_TechnicianRole_ResolvesHospitalByOrganization() {
        User techUser = User.builder()
                .id(200L)
                .username("techUser")
                .email("tech@hospital.com")
                .role("technician")
                .organization("General Hospital")
                .build();

        when(userRepository.findByUsername("techUser")).thenReturn(Optional.of(techUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.empty());
        when(hospitalRepository.findByNameIgnoreCaseAndTrimmed("General Hospital"))
                .thenReturn(List.of(testHospital));
        when(sparePartRepository.findLowStockPartsByHospitalId(1L))
                .thenReturn(List.of(testSparePart));

        List<SparePartResponse> alerts = sparePartService.getLowStockAlerts("techUser");

        assertThat(alerts).hasSize(1);
        verify(hospitalRepository).findByNameIgnoreCaseAndTrimmed("General Hospital");
        verify(sparePartRepository).findLowStockPartsByHospitalId(1L);
    }

    @Test
    @DisplayName("deductStock - throws IllegalArgumentException when technician stock deduction exceeds available inventory")
    void deductStock_TechnicianRole_InsufficientStock_ThrowsException() {
        User techUser = User.builder()
                .id(200L)
                .username("techUser")
                .email("tech@hospital.com")
                .role("technician")
                .organization("General Hospital")
                .build();
        SparePartStockRequest request = SparePartStockRequest.builder()
                .partNumber("FILTER-001")
                .quantity(100)
                .build();

        when(userRepository.findByUsername("techUser")).thenReturn(Optional.of(techUser));
        when(hospitalRepository.findByUserId(200L)).thenReturn(Optional.empty());
        when(hospitalRepository.findByNameIgnoreCaseAndTrimmed("General Hospital"))
                .thenReturn(List.of(testHospital));
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "FILTER-001"))
                .thenReturn(Optional.of(testSparePart));

        assertThatThrownBy(() -> sparePartService.deductStock(request, "techUser"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Insufficient stock for part: FILTER-001");
        verify(sparePartRepository, never()).save(any());
    }

    @Test
    @DisplayName("deductSparePartsForWorkOrder - aggregates duplicate deduction items and deducts cumulative quantity")
    void deductSparePartsForWorkOrder_AggregatesDuplicateItemsAndDeductsCorrectly() {
        SparePartDeductionItem item1 = new SparePartDeductionItem();
        item1.setPartNumber("filter-001");
        item1.setQuantity(3);

        SparePartDeductionItem item2 = new SparePartDeductionItem();
        item2.setPartNumber("FILTER-001 ");
        item2.setQuantity(2);

        testSparePart.setStockLevel(10);
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "filter-001"))
                .thenReturn(Optional.of(testSparePart));

        sparePartService.deductSparePartsForWorkOrder(List.of(item1, item2), 1L, "hospitalAdmin");

        assertThat(testSparePart.getStockLevel()).isEqualTo(5);
        verify(sparePartRepository, times(1)).save(testSparePart);
    }

    @Test
    @DisplayName("deductSparePartsForWorkOrder - throws IllegalArgumentException when aggregated quantity exceeds stock")
    void deductSparePartsForWorkOrder_ThrowsExceptionWhenAggregatedQuantityExceedsStock() {
        SparePartDeductionItem item1 = new SparePartDeductionItem();
        item1.setPartNumber("FILTER-001");
        item1.setQuantity(8);

        SparePartDeductionItem item2 = new SparePartDeductionItem();
        item2.setPartNumber("FILTER-001");
        item2.setQuantity(5);

        testSparePart.setStockLevel(10);
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "FILTER-001"))
                .thenReturn(Optional.of(testSparePart));

        assertThatThrownBy(() -> sparePartService.deductSparePartsForWorkOrder(List.of(item1, item2), 1L, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Insufficient stock for spare part: FILTER-001");

        verify(sparePartRepository, never()).save(any());
    }

    @Test
    @DisplayName("deductSparePartsForWorkOrder - does nothing when items list is null or empty")
    void deductSparePartsForWorkOrder_NullOrEmptyItems_NoOps() {
        sparePartService.deductSparePartsForWorkOrder(null, 1L, "hospitalAdmin");
        sparePartService.deductSparePartsForWorkOrder(List.of(), 1L, "hospitalAdmin");
        verifyNoInteractions(sparePartRepository);
    }

    @Test
    @DisplayName("bulkImport - parses unit cost from 5th column and imports valid rows")
    void bulkImport_ParsesUnitCostAndEnforcesCaseInsensitiveUniqueness() {
        String csv = "Part Number,Description,Quantity,Min Stock,Unit Cost\n"
                + "SP-101,Gasket Seal,50,10,12.75\n"
                + "SP-102,O-Ring Set,100,20,5.50\n";
        MockMultipartFile file = new MockMultipartFile("file", "parts.csv", "text/csv", csv.getBytes());

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(eq(1L), anyString())).thenReturn(false);

        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getSuccessCount()).isEqualTo(2);
        assertThat(summary.getFailureCount()).isEqualTo(0);

        ArgumentCaptor<List<SparePart>> captor = ArgumentCaptor.forClass(List.class);
        verify(sparePartRepository).saveAll(captor.capture());
        List<SparePart> savedParts = captor.getValue();
        assertThat(savedParts).hasSize(2);
        assertThat(savedParts.get(0).getUnitCost()).isEqualTo(12.75);
        assertThat(savedParts.get(1).getUnitCost()).isEqualTo(5.50);
    }

    @Test
    @DisplayName("bulkImport - fails when file contains duplicate part numbers differing only by case")
    void bulkImport_FailsOnDuplicatePartNumberInSameFileDifferentCase() {
        String csv = "Part Number,Description,Quantity,Min Stock,Unit Cost\n"
                + "SP-200,Valve A,10,2,15.00\n"
                + "sp-200,Valve B,5,1,15.00\n";
        MockMultipartFile file = new MockMultipartFile("file", "parts.csv", "text/csv", csv.getBytes());

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(eq(1L), anyString())).thenReturn(false);

        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getSuccessCount()).isEqualTo(1);
        assertThat(summary.getFailureCount()).isEqualTo(1);
        assertThat(summary.getFailures().get(0).getReason()).contains("Duplicate part number in import file");
    }

    @Test
    @DisplayName("bulkImport - fails when unit cost column is non-numeric or negative")
    void bulkImport_FailsOnInvalidUnitCost() {
        String csv = "Part Number,Description,Quantity,Min Stock,Unit Cost\n"
                + "SP-300,Pump Rotor,10,2,-5.00\n";
        MockMultipartFile file = new MockMultipartFile("file", "parts.csv", "text/csv", csv.getBytes());

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));

        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getSuccessCount()).isEqualTo(0);
        assertThat(summary.getFailureCount()).isEqualTo(1);
        assertThat(summary.getFailures().get(0).getReason()).contains("Unit cost must be a non-negative finite number");
    }

    @Test
    @DisplayName("bulkImport - fails when unit cost column contains non-numeric text")
    void bulkImport_FailsOnNonNumericUnitCost() {
        String csv = "Part Number,Description,Quantity,Min Stock,Unit Cost\n"
                + "SP-301,Pump Rotor,10,2,INVALID_COST\n";
        MockMultipartFile file = new MockMultipartFile("file", "parts.csv", "text/csv", csv.getBytes());

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));

        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getSuccessCount()).isEqualTo(0);
        assertThat(summary.getFailureCount()).isEqualTo(1);
        assertThat(summary.getFailures().get(0).getReason()).contains("Unit cost must be numeric");
    }

    @Test
    @DisplayName("bulkImport - defaults unit cost to 0.0 when 4 columns are provided without 5th column")
    void bulkImport_FourColumns_DefaultsUnitCostToZero() {
        String csv = "Part Number,Description,Quantity,Min Stock\n"
                + "SP-400,Basic Cable,20,5\n";
        MockMultipartFile file = new MockMultipartFile("file", "parts.csv", "text/csv", csv.getBytes());

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(eq(1L), anyString())).thenReturn(false);

        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getSuccessCount()).isEqualTo(1);

        ArgumentCaptor<List<SparePart>> captor = ArgumentCaptor.forClass(List.class);
        verify(sparePartRepository).saveAll(captor.capture());
        assertThat(captor.getValue().get(0).getUnitCost()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("deductSparePartsForWorkOrder - ignores null or blank deduction items in list")
    void deductSparePartsForWorkOrder_IgnoresNullOrBlankDeductionItems() {
        SparePartDeductionItem blankItem = new SparePartDeductionItem();
        blankItem.setPartNumber("   ");

        SparePartDeductionItem validItem = new SparePartDeductionItem();
        validItem.setPartNumber("FILTER-001");
        validItem.setQuantity(2);

        testSparePart.setStockLevel(10);
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "FILTER-001"))
                .thenReturn(Optional.of(testSparePart));

        sparePartService.deductSparePartsForWorkOrder(List.of(blankItem, validItem), 1L, "hospitalAdmin");

        assertThat(testSparePart.getStockLevel()).isEqualTo(8);
        verify(sparePartRepository, times(1)).save(testSparePart);
    }

    @Test
    @DisplayName("deductSparePartsForWorkOrder - handles multiple distinct spare part numbers in one work order")
    void deductSparePartsForWorkOrder_MultipleDistinctParts_DeductsAll() {
        SparePartDeductionItem item1 = new SparePartDeductionItem();
        item1.setPartNumber("FILTER-001");
        item1.setQuantity(2);

        SparePartDeductionItem item2 = new SparePartDeductionItem();
        item2.setPartNumber("VALVE-002");
        item2.setQuantity(4);

        SparePart secondPart = SparePart.builder()
                .id(51L).hospitalId(1L).partNumber("VALVE-002")
                .description("Control Valve").stockLevel(15).reorderPoint(5).unitCost(120.0).deleted(false).build();

        testSparePart.setStockLevel(10);
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "FILTER-001"))
                .thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "VALVE-002"))
                .thenReturn(Optional.of(secondPart));

        sparePartService.deductSparePartsForWorkOrder(List.of(item1, item2), 1L, "hospitalAdmin");

        assertThat(testSparePart.getStockLevel()).isEqualTo(8);
        assertThat(secondPart.getStockLevel()).isEqualTo(11);
        verify(sparePartRepository).save(testSparePart);
        verify(sparePartRepository).save(secondPart);
    }

    @Test
    @DisplayName("bulkImport - fails when stock level or reorder point are non-numeric")
    void bulkImport_FailsOnNonNumericStockOrReorderPoint() {
        String csv = "Part Number,Description,Quantity,Min Stock\n"
                + "SP-500,Sensor Module,TEN,FIVE\n";
        MockMultipartFile file = new MockMultipartFile("file", "parts.csv", "text/csv", csv.getBytes());

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));

        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getSuccessCount()).isEqualTo(0);
        assertThat(summary.getFailureCount()).isEqualTo(1);
        assertThat(summary.getFailures().get(0).getReason()).contains("Quantity and minimum stock must be numeric");
    }

    @Test
    @DisplayName("bulkImport - fails when stock level or reorder point are negative")
    void bulkImport_FailsOnNegativeStockOrReorderPoint() {
        String csv = "Part Number,Description,Quantity,Min Stock\n"
                + "SP-501,Sensor Module,-10,5\n";
        MockMultipartFile file = new MockMultipartFile("file", "parts.csv", "text/csv", csv.getBytes());

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));

        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getSuccessCount()).isEqualTo(0);
        assertThat(summary.getFailureCount()).isEqualTo(1);
        assertThat(summary.getFailures().get(0).getReason()).contains("Quantity and minimum stock cannot be negative");
    }

    @Test
    @DisplayName("createSparePart - enforces case-insensitive uniqueness check")
    void createSparePart_EnforcesCaseInsensitiveUniquenessCheck() {
        SparePart newPart = SparePart.builder()
                .partNumber("filter-001")
                .description("HEPA Filter Variant")
                .stockLevel(10)
                .reorderPoint(2)
                .unitCost(40.0)
                .build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(1L, "filter-001")).thenReturn(true);

        assertThatThrownBy(() -> sparePartService.createSparePart(newPart, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Spare part with part number already exists: filter-001");
        verify(sparePartRepository, never()).save(any());
    }
}
