package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.SparePartImportSummary;
import com.medtrack.model.Hospital;
import com.medtrack.model.SparePart;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.SparePartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SparePartBulkImportTest {

    @Mock
    private SparePartRepository sparePartRepository;
    
    @Mock
    private HospitalRepository hospitalRepository;
    
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SparePartService sparePartService;

    private User testUser;
    private Hospital testHospital;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(100L).username("hospitalAdmin").email("admin@hospital.com").build();
        testHospital = Hospital.builder().id(1L).user(testUser).name("General Hospital").build();
    }

    private MultipartFile createCsvFile(String content) {
        return new MockMultipartFile("file", "import.csv", "text/csv", content.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("bulkImport - successfully imports all valid rows")
    void bulkImport_ValidCsv_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(eq(1L), anyString())).thenReturn(false);

        String csvContent = "Part Number,Name,Quantity,Minimum Stock,Supplier\nPART-01,Filter A,10,5,Supplier X\nPART-02,Valve B,20,10,Supplier Y\n";

        MultipartFile file = createCsvFile(csvContent);
        
        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getTotalRows()).isEqualTo(2);
        assertThat(summary.getSuccessCount()).isEqualTo(2);
        assertThat(summary.getFailureCount()).isEqualTo(0);

        ArgumentCaptor<List<SparePart>> captor = ArgumentCaptor.forClass(List.class);
        verify(sparePartRepository).saveAll(captor.capture());
        
        List<SparePart> savedParts = captor.getValue();
        assertThat(savedParts).hasSize(2);
        assertThat(savedParts.get(0).getPartNumber()).isEqualTo("PART-01");
        assertThat(savedParts.get(1).getPartNumber()).isEqualTo("PART-02");
    }

    @Test
    @DisplayName("bulkImport - fails for missing required fields")
    void bulkImport_MissingFields_RowSpecificError() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));

        String csvContent = "Part Number,Name,Quantity,Minimum Stock\n,Filter A,10,5\nPART-02,,20,10\n";     

        MultipartFile file = createCsvFile(csvContent);
        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getTotalRows()).isEqualTo(2);
        assertThat(summary.getSuccessCount()).isEqualTo(0);
        assertThat(summary.getFailureCount()).isEqualTo(2);
        assertThat(summary.getFailures().get(0).getReason()).contains("Missing required fields");
        verify(sparePartRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("bulkImport - handles invalid quantity and minimum stock")
    void bulkImport_InvalidNumbers_RowSpecificError() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));

        String csvContent = "Part Number,Name,Quantity,Minimum Stock\nPART-01,Filter A,abc,5\nPART-02,Valve B,20,-10\n";

        MultipartFile file = createCsvFile(csvContent);
        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getTotalRows()).isEqualTo(2);
        assertThat(summary.getFailureCount()).isEqualTo(2);
        assertThat(summary.getFailures().get(0).getReason()).contains("numeric");
        assertThat(summary.getFailures().get(1).getReason()).contains("negative");
    }

    @Test
    @DisplayName("bulkImport - handles duplicate part number in DB")
    void bulkImport_DuplicateInDb_RowSpecificError() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(1L, "PART-01")).thenReturn(true);

        String csvContent = "Part Number,Name,Quantity,Minimum Stock\nPART-01,Filter A,10,5\n";

        MultipartFile file = createCsvFile(csvContent);
        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getFailureCount()).isEqualTo(1);
        assertThat(summary.getFailures().get(0).getReason()).contains("already exists");
    }
    
    @Test
    @DisplayName("bulkImport - handles empty CSV")
    void bulkImport_EmptyCsv_ThrowsException() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        MultipartFile file = createCsvFile("");
        
        assertThatThrownBy(() -> sparePartService.bulkImport(file, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("empty");
    }
    
    @Test
    @DisplayName("bulkImport - handles malformed CSV")
    void bulkImport_MalformedCsv_ThrowsException() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        String csvContent = "Part Number,Name,Quantity,Minimum Stock\nPART-01,\"Filter A,10,5"; 
        MultipartFile file = createCsvFile(csvContent);
        
        assertThatThrownBy(() -> sparePartService.bulkImport(file, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Malformed CSV");
    }

    @Test
    @DisplayName("bulkImport - successfully maps reordered CSV headers")
    void bulkImport_ReorderedCsvHeaders_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(eq(1L), anyString())).thenReturn(false);

        String csvContent = "Quantity,Part Number,Unit Cost,Minimum Stock,Description\n15,PART-REORDER,49.99,5,Reordered Valve\n";
        MultipartFile file = createCsvFile(csvContent);

        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getTotalRows()).isEqualTo(1);
        assertThat(summary.getSuccessCount()).isEqualTo(1);
        assertThat(summary.getFailureCount()).isEqualTo(0);

        ArgumentCaptor<List<SparePart>> captor = ArgumentCaptor.forClass(List.class);
        verify(sparePartRepository).saveAll(captor.capture());

        SparePart saved = captor.getValue().get(0);
        assertThat(saved.getPartNumber()).isEqualTo("PART-REORDER");
        assertThat(saved.getDescription()).isEqualTo("Reordered Valve");
        assertThat(saved.getStockLevel()).isEqualTo(15);
        assertThat(saved.getReorderPoint()).isEqualTo(5);
        assertThat(saved.getUnitCost()).isEqualTo(49.99);
    }

    @Test
    @DisplayName("bulkImport - ignores extra non-cost text columns gracefully")
    void bulkImport_ExtraMetadataColumns_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(eq(1L), anyString())).thenReturn(false);

        String csvContent = "Part Number,Name,Quantity,Minimum Stock,Supplier,Location\nPART-EXTRA,Sensor C,30,10,Vendor Z,Shelf 4\n";
        MultipartFile file = createCsvFile(csvContent);

        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getTotalRows()).isEqualTo(1);
        assertThat(summary.getSuccessCount()).isEqualTo(1);

        ArgumentCaptor<List<SparePart>> captor = ArgumentCaptor.forClass(List.class);
        verify(sparePartRepository).saveAll(captor.capture());

        SparePart saved = captor.getValue().get(0);
        assertThat(saved.getPartNumber()).isEqualTo("PART-EXTRA");
        assertThat(saved.getDescription()).isEqualTo("Sensor C");
        assertThat(saved.getUnitCost()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("bulkImport - correctly maps compatible models column header")
    void bulkImport_CompatibleModelsHeader_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(eq(1L), anyString())).thenReturn(false);

        String csvContent = "Part Number,Item Name,Qty,Reorder Point,Compatible Models\nPART-MODEL,Cable D,5,2,Model X / Model Y\n";
        MultipartFile file = createCsvFile(csvContent);

        SparePartImportSummary summary = sparePartService.bulkImport(file, "hospitalAdmin");

        assertThat(summary.getSuccessCount()).isEqualTo(1);
        ArgumentCaptor<List<SparePart>> captor = ArgumentCaptor.forClass(List.class);
        verify(sparePartRepository).saveAll(captor.capture());
        assertThat(captor.getValue().get(0).getCompatibleModels()).isEqualTo("Model X / Model Y");
    }
}
