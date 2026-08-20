package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentImportSummary;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.util.CsvSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests verifying UTF-8 character encoding, BOM handling, and round-trip consistency
 * during equipment CSV export and import operations in {@link EquipmentService}.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EquipmentService CSV UTF-8 Encoding & Round-Trip Tests")
class EquipmentCsvEncodingTest {

    private static final String USERNAME = "admin_user";
    private static final Long HOSPITAL_ID = 42L;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EquipmentImportAuditLogRepository equipmentImportAuditLogRepository;

    @InjectMocks
    private EquipmentService equipmentService;

    private Hospital testHospital;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(100L)
                .username(USERNAME)
                .email("admin@hospital.org")
                .build();

        testHospital = Hospital.builder()
                .id(HOSPITAL_ID)
                .name("St. Jude Memorial Hospital")
                .user(testUser)
                .build();

        lenient().when(userRepository.findByUsername(USERNAME))
                .thenReturn(Optional.of(testUser));
        lenient().when(hospitalRepository.findByUserId(100L))
                .thenReturn(Optional.of(testHospital));
    }

    private MockHttpServletResponse executeExport() throws IOException {
        MockHttpServletResponse response = new MockHttpServletResponse();
        equipmentService.exportEquipmentCsv(USERNAME, response);
        return response;
    }

    private byte[] getExportBytes() throws IOException {
        return executeExport().getContentAsByteArray();
    }

    private String getExportString() throws IOException {
        return new String(getExportBytes(), StandardCharsets.UTF_8);
    }

    @Test
    @DisplayName("Verify CSV export sets UTF-8 response character encoding and content type header")
    void testExportCsvSetsUtf8ResponseEncoding() throws IOException {
        when(equipmentRepository.findStreamByHospitalId(HOSPITAL_ID))
                .thenReturn(java.util.stream.Stream.empty());

        MockHttpServletResponse response = executeExport();

        assertEquals("UTF-8", response.getCharacterEncoding(),
                "HTTP Response character encoding must be explicitly set to UTF-8");
        assertEquals("text/csv; charset=UTF-8", response.getContentType(),
                "HTTP Response content type must include text/csv with UTF-8 charset");
        assertEquals("attachment; filename=equipment.csv", response.getHeader("Content-Disposition"),
                "HTTP Response must include correct Content-Disposition header");
    }

    @Test
    @DisplayName("Verify exported CSV starts with UTF-8 Byte Order Mark (BOM)")
    void testExportCsvStartsWithUtf8Bom() throws IOException {
        when(equipmentRepository.findStreamByHospitalId(HOSPITAL_ID))
                .thenReturn(java.util.stream.Stream.empty());

        String csvOutput = getExportString();

        assertTrue(csvOutput.startsWith(CsvSupport.UTF8_BOM),
                "Exported CSV document must begin with the UTF-8 Byte Order Mark (\\uFEFF)");
    }

    @Test
    @DisplayName("Verify non-ASCII asset names survive CSV export without character degradation")
    void testNonAsciiEquipmentNameExportEncoding() throws IOException {
        Equipment nonAsciiEquipment = Equipment.builder()
                .equipmentCode("EQ-DEF-88")
                .name("Röntgengerät µ-Scan")
                .model("Optima-750X")
                .serialNumber("SN-DE-9941")
                .department("Radiologie")
                .category(EquipmentCategory.IMAGING)
                .status(EquipmentStatus.ACTIVE)
                .hospital(testHospital)
                .build();

        when(equipmentRepository.findStreamByHospitalId(HOSPITAL_ID))
                .thenReturn(java.util.stream.Stream.of(nonAsciiEquipment));

        String csvOutput = getExportString();

        assertTrue(csvOutput.contains("Röntgengerät µ-Scan"),
                "Exported CSV output must contain exact non-ASCII characters in asset name");
    }

    @Test
    @DisplayName("Verify equipment code and warranty dates survive CSV export/import round-trip")
    void testEquipmentCodeAndWarrantySurviveRoundTrip() throws IOException {
        LocalDate purchaseDate = LocalDate.of(2024, 5, 15);
        LocalDate warrantyExpiry = LocalDate.of(2028, 5, 15);

        Equipment originalAsset = Equipment.builder()
                .equipmentCode("EQ-ORIG-1001")
                .name("Echocardiogram Station")
                .model("Vivid E95")
                .serialNumber("SN-ECHO-300")
                .department("Cardiology")
                .category(EquipmentCategory.MONITORING)
                .status(EquipmentStatus.ACTIVE)
                .purchaseDate(purchaseDate)
                .warrantyExpiry(warrantyExpiry)
                .hospital(testHospital)
                .build();

        when(equipmentRepository.findStreamByHospitalId(HOSPITAL_ID))
                .thenReturn(java.util.stream.Stream.of(originalAsset));

        byte[] exportedCsvBytes = getExportBytes();

        MockMultipartFile multipartFile = new MockMultipartFile(
                "file",
                "equipment_export.csv",
                "text/csv",
                exportedCsvBytes
        );

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(multipartFile, USERNAME);

        assertEquals(1, summary.getSuccessCount(), "Import of exported file should succeed for 1 row");
        assertEquals(0, summary.getFailureCount(), "Import of exported file should have zero failures");

        ArgumentCaptor<List<Equipment>> captor = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(captor.capture());

        List<Equipment> savedList = captor.getValue();
        assertNotNull(savedList, "Saved equipment list should not be null");
        assertEquals(1, savedList.size(), "Should persist exactly 1 equipment entity");

        Equipment reimportedAsset = savedList.get(0);
        assertEquals("EQ-ORIG-1001", reimportedAsset.getEquipmentCode(),
                "Equipment code must be preserved across export/import round-trip without UUID replacement");
        assertEquals("Echocardiogram Station", reimportedAsset.getName());
        assertEquals("SN-ECHO-300", reimportedAsset.getSerialNumber());
        assertEquals(warrantyExpiry, reimportedAsset.getWarrantyExpiry(),
                "Warranty expiry date must survive export/import round-trip");
        assertEquals(purchaseDate, reimportedAsset.getPurchaseDate(),
                "Purchase date must survive export/import round-trip");
    }

    @Test
    @DisplayName("Verify CSV import safely handles leading BOM in header keys")
    void testImportSafelyStripsLeadingBomFromHeaderKeys() {
        String bomCsvContent = CsvSupport.UTF8_BOM
                + "Equipment Code,Name,Model,Serial Number,Department,Category,Status\r\n"
                + "EQ-BOM-55,Ultrasound Pro,Pro-2026,SN-UL-12,Obstetrics,MONITORING,ACTIVE\r\n";

        byte[] csvBytes = bomCsvContent.getBytes(StandardCharsets.UTF_8);

        MockMultipartFile multipartFile = new MockMultipartFile(
                "file",
                "bom_test.csv",
                "text/csv",
                csvBytes
        );

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(multipartFile, USERNAME);

        assertEquals(1, summary.getSuccessCount(), "Row with leading BOM in header key should be parsed successfully");

        ArgumentCaptor<List<Equipment>> captor = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(captor.capture());

        Equipment savedEquipment = captor.getValue().get(0);
        assertEquals("EQ-BOM-55", savedEquipment.getEquipmentCode(),
                "Equipment code from first column must be correctly extracted despite leading BOM");
    }

    @Test
    @DisplayName("Verify re-importing exported CSV updates existing record rather than duplicating")
    void testReimportingExportUpdatesExistingAsset() throws IOException {
        Equipment existingAsset = Equipment.builder()
                .equipmentCode("EQ-STABLE-77")
                .name("Defibrillator Touch")
                .model("LifePak 15")
                .serialNumber("SN-DEFIB-77")
                .department("Emergency")
                .category(EquipmentCategory.SURGICAL)
                .status(EquipmentStatus.ACTIVE)
                .hospital(testHospital)
                .build();

        when(equipmentRepository.findStreamByHospitalId(HOSPITAL_ID))
                .thenReturn(java.util.stream.Stream.of(existingAsset));
        when(equipmentRepository.findByEquipmentCode("EQ-STABLE-77"))
                .thenReturn(Optional.of(existingAsset));

        byte[] exportedBytes = getExportBytes();

        MockMultipartFile multipartFile = new MockMultipartFile(
                "file",
                "update_test.csv",
                "text/csv",
                exportedBytes
        );

        EquipmentImportSummary summary = equipmentService.importEquipmentFromCsv(multipartFile, USERNAME);

        assertEquals(1, summary.getSuccessCount());
        assertEquals(0, summary.getFailureCount());

        ArgumentCaptor<List<Equipment>> captor = ArgumentCaptor.forClass(List.class);
        verify(equipmentRepository).saveAll(captor.capture());

        Equipment updatedAsset = captor.getValue().get(0);
        assertEquals("EQ-STABLE-77", updatedAsset.getEquipmentCode());
        assertEquals(HOSPITAL_ID, updatedAsset.getHospital().getId());
    }

    @Test
    @DisplayName("Verify CSV export handles multiple assets with special characters and multiline notes")
    void testExportCsvWithMultipleAssetsAndSpecialCharacters() throws IOException {
        Equipment asset1 = Equipment.builder()
                .equipmentCode("EQ-MULTI-1")
                .name("Anesthesia Machine, Type \"A\"")
                .model("Flow-i C20")
                .serialNumber("SN-AN-001")
                .department("Operating Room")
                .category(EquipmentCategory.SURGICAL)
                .status(EquipmentStatus.ACTIVE)
                .hospital(testHospital)
                .build();

        Equipment asset2 = Equipment.builder()
                .equipmentCode("EQ-MULTI-2")
                .name("Centrifuge & Rotor\n(High-Speed)")
                .model("Sorvall ST 8")
                .serialNumber("SN-CENT-002")
                .department("Pathology")
                .category(EquipmentCategory.LABORATORY)
                .status(EquipmentStatus.UNDER_MAINTENANCE)
                .hospital(testHospital)
                .build();

        when(equipmentRepository.findStreamByHospitalId(HOSPITAL_ID))
                .thenReturn(java.util.stream.Stream.of(asset1, asset2));

        String csvContent = getExportString();

        assertTrue(csvContent.contains("EQ-MULTI-1"), "Output must contain asset 1 code");
        assertTrue(csvContent.contains("Anesthesia Machine, Type \"\"A\"\""), "Output must properly encode quotes in RFC 4180 format");
        assertTrue(csvContent.contains("EQ-MULTI-2"), "Output must contain asset 2 code");
    }

    @Test
    @DisplayName("Verify CSV export formatting for optional null fields and date fields")
    void testExportCsvWithNullOptionalFieldsAndDates() throws IOException {
        Equipment assetWithNulls = Equipment.builder()
                .equipmentCode("EQ-NULL-99")
                .name("Basic Examination Table")
                .department("Outpatient")
                .category(EquipmentCategory.OTHER)
                .status(EquipmentStatus.ACTIVE)
                .purchaseDate(null)
                .warrantyExpiry(null)
                .hospital(testHospital)
                .build();

        when(equipmentRepository.findStreamByHospitalId(HOSPITAL_ID))
                .thenReturn(java.util.stream.Stream.of(assetWithNulls));

        String csvOutput = getExportString();

        assertTrue(csvOutput.contains("EQ-NULL-99"), "Output must contain equipment code");
        assertTrue(csvOutput.contains("Basic Examination Table"), "Output must contain asset name");
    }
}
