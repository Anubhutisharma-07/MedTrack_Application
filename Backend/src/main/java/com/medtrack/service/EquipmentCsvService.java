package com.medtrack.service;

import com.medtrack.dto.EquipmentImportPreviewResponse;
import com.medtrack.dto.EquipmentImportSummary;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.model.EquipmentImportAuditLog;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.WarrantyCoverageType;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.util.CsvSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service for equipment CSV import/export operations.
 * Handles bulk data import, preview, and export functionality.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EquipmentCsvService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentImportAuditLogRepository equipmentImportAuditLogRepository;

    @org.springframework.beans.factory.annotation.Value("${app.equipment.export.filename:equipment.csv}")
    private String equipmentExportFilename;

    /**
     * Column order for both the export and the import template.
     */
    static final String[] EQUIPMENT_CSV_HEADERS = {
            "Equipment Code", "Name", "Model", "Serial Number", "Department",
            "Category", "Status", "Purchase Date", "Warranty Expiry",
            "Purchase Cost", "Useful Life (Years)", "Depreciation Method",
            "Warranty Provider", "Warranty Contract Number", "Warranty Start Date",
            "Warranty Coverage Type", "Warranty Terms"
    };

    /**
     * Imports multiple equipment items from a CSV upload.
     * Performs row-by-row validation and commits all valid rows in a batch transaction.
     */
    @Transactional
    public EquipmentImportSummary importEquipmentFromCsv(MultipartFile file, Hospital hospital, String username) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty or missing");
        }

        ParsedImport parsed = parseAndValidateImport(file, hospital);

        if (!parsed.equipmentToSave.isEmpty()) {
            equipmentRepository.saveAll(parsed.equipmentToSave);
        }

        int totalRows = parsed.successCount + parsed.failureCount;
        equipmentImportAuditLogRepository.save(EquipmentImportAuditLog.builder()
                .hospitalId(hospital.getId())
                .actor(username)
                .filename(file.getOriginalFilename() != null ? file.getOriginalFilename() : "equipment.csv")
                .totalRows(totalRows)
                .successCount(parsed.successCount)
                .failureCount(parsed.failureCount)
                .failures(failuresToJson(parsed.failures))
                .importedAt(LocalDateTime.now())
                .build());

        log.info("Equipment bulk import | User: {} | File: {} | Total: {} | Success: {} | Failed: {}",
                username,
                file.getOriginalFilename(),
                totalRows,
                parsed.successCount,
                parsed.failureCount);

        return EquipmentImportSummary.builder()
                .successCount(parsed.successCount)
                .failureCount(parsed.failureCount)
                .failures(parsed.failures)
                .build();
    }

    /**
     * Dry-runs a bulk import: parses and validates every row exactly as
     * {@link #importEquipmentFromCsv} would, but writes nothing.
     */
    public EquipmentImportPreviewResponse previewEquipmentImport(MultipartFile file, Hospital hospital) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty or missing");
        }

        ParsedImport parsed = parseAndValidateImport(file, hospital);

        return EquipmentImportPreviewResponse.builder()
                .totalRows(parsed.successCount + parsed.failureCount)
                .validCount(parsed.successCount)
                .failureCount(parsed.failureCount)
                .validRows(parsed.validRows)
                .failures(parsed.failures)
                .build();
    }

    /**
     * Recent import batches for the caller's hospital, newest first.
     */
    public List<com.medtrack.model.EquipmentImportAuditLog> getImportAuditLogs(Long hospitalId) {
        return equipmentImportAuditLogRepository
                .findTop20ByHospitalIdOrderByImportedAtDesc(hospitalId);
    }

    /**
     * Exports the caller's inventory as RFC 4180 CSV.
     */
    @Transactional(readOnly = true)
    public void exportEquipmentCsv(Long hospitalId, jakarta.servlet.http.HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=" + equipmentExportFilename);

        try (java.io.PrintWriter writer = response.getWriter();
             java.util.stream.Stream<Equipment> equipmentStream = equipmentRepository.findStreamByHospitalId(hospitalId)) {
            writer.write(CsvSupport.UTF8_BOM);
            writer.write(CsvSupport.encodeRow((Object[]) EQUIPMENT_CSV_HEADERS));

            equipmentStream.forEach(equipment -> {
                writer.write(CsvSupport.encodeRow(
                        equipment.getEquipmentCode(),
                        equipment.getName(),
                        equipment.getModel(),
                        equipment.getSerialNumber(),
                        equipment.getDepartment(),
                        equipment.getCategory(),
                        equipment.getStatus(),
                        equipment.getPurchaseDate(),
                        equipment.getWarrantyExpiry(),
                        equipment.getPurchaseCost(),
                        equipment.getUsefulLifeYears(),
                        equipment.getDepreciationMethod(),
                        equipment.getWarrantyProvider(),
                        equipment.getWarrantyContractNumber(),
                        equipment.getWarrantyStartDate(),
                        equipment.getWarrantyCoverageType(),
                        equipment.getWarrantyTerms()));
            });
        }
    }

    /**
     * Shared parse-and-validate pass used by both the real import and the dry-run preview.
     */
    private ParsedImport parseAndValidateImport(MultipartFile file, Hospital hospital) {
        List<Equipment> equipmentToSave = new ArrayList<>();
        List<EquipmentImportSummary.RowFailure> failures = new ArrayList<>();
        List<EquipmentImportPreviewResponse.PreviewRow> validRows = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;
        Set<String> serialNumbersInFile = new HashSet<>();
        Set<String> equipmentCodesInFile = new HashSet<>();

        try (java.io.InputStream input = file.getInputStream()) {
            String document = new String(input.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);

            List<String> records = CsvSupport.splitRecords(document);
            if (records.isEmpty()) {
                throw new IllegalArgumentException("CSV file has no content");
            }

            List<String> headers = parseCsvLine(records.get(0));
            if (headers.size() < 4) {
                throw new IllegalArgumentException("CSV file must contain at least: Name, Department, Category, Status");
            }

            int rowNum = 1;
            for (int recordIndex = 1; recordIndex < records.size(); recordIndex++) {
                String line = records.get(recordIndex);
                rowNum++;

                List<String> fields;
                try {
                    fields = parseCsvLine(line);
                } catch (CsvSupport.MalformedCsvException e) {
                    failures.add(new EquipmentImportSummary.RowFailure(rowNum, line, e.getMessage()));
                    failureCount++;
                    continue;
                }
                if (fields.size() < headers.size()) {
                    failures.add(new EquipmentImportSummary.RowFailure(rowNum, line, "Row has fewer columns than headers"));
                    failureCount++;
                    continue;
                }

                String name = getFieldValue(fields, headers, "Name");
                String model = getFieldValue(fields, headers, "Model");
                String serialNumber = getFieldValue(fields, headers, "Serial Number");
                String department = getFieldValue(fields, headers, "Department");
                String category = getFieldValue(fields, headers, "Category");
                String status = getFieldValue(fields, headers, "Status");
                String purchaseDateStr = getFieldValue(fields, headers, "Purchase Date");
                String equipmentCode = getFieldValue(fields, headers, "Equipment Code");
                String warrantyExpiryStr = getFieldValue(fields, headers, "Warranty Expiry");
                String purchaseCostStr = getFieldValue(fields, headers, "Purchase Cost");
                String usefulLifeStr = getFieldValue(fields, headers, "Useful Life (Years)");
                String depreciationMethodStr = getFieldValue(fields, headers, "Depreciation Method");
                String warrantyProviderStr = getFieldValue(fields, headers, "Warranty Provider");
                String warrantyContractNumberStr = getFieldValue(fields, headers, "Warranty Contract Number");
                String warrantyStartDateStr = getFieldValue(fields, headers, "Warranty Start Date");
                String warrantyCoverageTypeStr = getFieldValue(fields, headers, "Warranty Coverage Type");
                String warrantyTermsStr = getFieldValue(fields, headers, "Warranty Terms");

                if (name == null || name.trim().isEmpty()) {
                    failures.add(new EquipmentImportSummary.RowFailure(rowNum, line, "Asset Name is required"));
                    failureCount++;
                    continue;
                }

                if (department == null || department.trim().isEmpty()) {
                    failures.add(new EquipmentImportSummary.RowFailure(rowNum, line, "Department is required"));
                    failureCount++;
                    continue;
                }

                EquipmentCategory equipmentCategory = parseCategory(category, rowNum, line, failures);
                if (equipmentCategory == null) {
                    failureCount++;
                    continue;
                }

                EquipmentStatus parsedStatus = parseStatus(status, rowNum, line, failures);
                if (parsedStatus == null) {
                    failureCount++;
                    continue;
                }

                LocalDate purchaseDate = parseDate(purchaseDateStr, rowNum, line, "Purchase Date", failures);
                if (purchaseDate == null && purchaseDateStr != null && !purchaseDateStr.trim().isEmpty()) {
                    failureCount++;
                    continue;
                }

                LocalDate warrantyExpiry = parseDate(warrantyExpiryStr, rowNum, line, "Warranty Expiry", failures);
                if (warrantyExpiry == null && warrantyExpiryStr != null && !warrantyExpiryStr.trim().isEmpty()) {
                    failureCount++;
                    continue;
                }

                BigDecimal purchaseCost = parseCost(purchaseCostStr, rowNum, line, failures);
                if (purchaseCost == null && purchaseCostStr != null && !purchaseCostStr.trim().isEmpty()) {
                    failureCount++;
                    continue;
                }

                Integer usefulLifeYears = parseUsefulLife(usefulLifeStr, rowNum, line, failures);
                if (usefulLifeYears == null && usefulLifeStr != null && !usefulLifeStr.trim().isEmpty()) {
                    failureCount++;
                    continue;
                }

                com.medtrack.model.DepreciationMethod depreciationMethod = parseDepreciationMethod(depreciationMethodStr, rowNum, line, failures);
                if (depreciationMethod == null && depreciationMethodStr != null && !depreciationMethodStr.trim().isEmpty()) {
                    failureCount++;
                    continue;
                }

                WarrantyCoverageType warrantyCoverageType = parseWarrantyCoverageType(warrantyCoverageTypeStr, rowNum, line, failures);
                if (warrantyCoverageType == null && warrantyCoverageTypeStr != null && !warrantyCoverageTypeStr.trim().isEmpty()) {
                    failureCount++;
                    continue;
                }

                LocalDate warrantyStartDate = parseDate(warrantyStartDateStr, rowNum, line, "Warranty Start Date", failures);
                if (warrantyStartDate == null && warrantyStartDateStr != null && !warrantyStartDateStr.trim().isEmpty()) {
                    failureCount++;
                    continue;
                }

                String warrantyProvider = blankToNull(warrantyProviderStr);
                String warrantyContractNumber = blankToNull(warrantyContractNumberStr);
                String warrantyTerms = blankToNull(warrantyTermsStr);

                if (!validateSerialNumber(serialNumber, equipmentCode, serialNumbersInFile, hospital, rowNum, line, failures)) {
                    failureCount++;
                    continue;
                }

                String trimmedCode = validateEquipmentCode(equipmentCode, equipmentCodesInFile, rowNum, line, failures);
                if (trimmedCode == null && equipmentCode != null && !equipmentCode.trim().isEmpty()) {
                    failureCount++;
                    continue;
                }

                Equipment existing = null;
                if (trimmedCode != null) {
                    Optional<Equipment> byCode = equipmentRepository.findByEquipmentCode(trimmedCode);
                    if (byCode.isPresent()) {
                        existing = byCode.get();
                        if (existing.getHospital() == null
                                || !hospital.getId().equals(existing.getHospital().getId())) {
                            failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                                    "Equipment Code " + trimmedCode + " belongs to another hospital"));
                            failureCount++;
                            continue;
                        }
                    }
                }

                Equipment equipment = buildEquipment(existing, name, model, serialNumber, department, equipmentCategory,
                        parsedStatus, purchaseDate, warrantyExpiry, purchaseCost, usefulLifeYears, depreciationMethod,
                        warrantyProvider, warrantyContractNumber, warrantyStartDate, warrantyCoverageType, warrantyTerms,
                        trimmedCode, hospital);

                equipmentToSave.add(equipment);
                validRows.add(new EquipmentImportPreviewResponse.PreviewRow(
                        rowNum, toPreviewRowData(equipment, name, model, serialNumber,
                        department, equipmentCategory, status, purchaseDate, warrantyExpiry,
                        purchaseCost, usefulLifeYears, depreciationMethod,
                        warrantyProvider, warrantyContractNumber, warrantyStartDate,
                        warrantyCoverageType, warrantyTerms)));
                successCount++;
            }

        } catch (IOException e) {
            throw new RuntimeException("Error reading CSV file", e);
        }

        return new ParsedImport(equipmentToSave, failures, validRows, successCount, failureCount);
    }

    private EquipmentCategory parseCategory(String category, int rowNum, String line, List<EquipmentImportSummary.RowFailure> failures) {
        if (category == null || category.trim().isEmpty()) {
            return EquipmentCategory.IMAGING;
        }

        List<EquipmentCategory> validCategories = List.of(
                EquipmentCategory.IMAGING,
                EquipmentCategory.SURGICAL,
                EquipmentCategory.MONITORING,
                EquipmentCategory.LABORATORY,
                EquipmentCategory.RESPIRATORY,
                EquipmentCategory.OTHER
        );

        String finalCat = category.trim().toUpperCase();

        if (validCategories.stream().noneMatch(c -> c.name().equals(finalCat))) {
            failures.add(new EquipmentImportSummary.RowFailure(
                    rowNum, line, "Invalid category. Allowed: IMAGING, SURGICAL, MONITORING, LABORATORY, RESPIRATORY, OTHER"));
            return null;
        }

        return validCategories.stream()
                .filter(c -> c.name().equals(finalCat))
                .findFirst()
                .orElse(EquipmentCategory.OTHER);
    }

    private EquipmentStatus parseStatus(String status, int rowNum, String line, List<EquipmentImportSummary.RowFailure> failures) {
        if (status == null || status.trim().isEmpty()) {
            status = "Operational";
        } else {
            List<String> validStatuses = List.of(
                    "Operational", "Maintenance", "Retired",
                    "ACTIVE", "UNDER_MAINTENANCE", "RETIRED");
            String finalStatus = status.trim();
            if (validStatuses.stream().noneMatch(s -> s.equalsIgnoreCase(finalStatus))) {
                failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                        "Invalid condition/status. Allowed: " + String.join(", ", validStatuses)));
                return null;
            }
            status = finalStatus;
        }

        if ("Maintenance".equalsIgnoreCase(status) || "UNDER_MAINTENANCE".equalsIgnoreCase(status)) {
            return EquipmentStatus.UNDER_MAINTENANCE;
        } else if ("Retired".equalsIgnoreCase(status) || "RETIRED".equalsIgnoreCase(status)) {
            return EquipmentStatus.RETIRED;
        }
        return EquipmentStatus.ACTIVE;
    }

    private LocalDate parseDate(String dateStr, int rowNum, String line, String fieldName, List<EquipmentImportSummary.RowFailure> failures) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr.trim());
        } catch (DateTimeParseException e) {
            failures.add(new EquipmentImportSummary.RowFailure(rowNum, line, "Invalid " + fieldName + " format. Expected YYYY-MM-DD"));
            return null;
        }
    }

    private BigDecimal parseCost(String costStr, int rowNum, String line, List<EquipmentImportSummary.RowFailure> failures) {
        if (costStr == null || costStr.trim().isEmpty()) {
            return null;
        }
        try {
            BigDecimal cost = new BigDecimal(costStr.trim());
            if (cost.signum() < 0) {
                throw new NumberFormatException("negative");
            }
            return cost;
        } catch (NumberFormatException e) {
            failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                    "Invalid Purchase Cost. Expected a non-negative number, e.g. 250000.00"));
            return null;
        }
    }

    private Integer parseUsefulLife(String lifeStr, int rowNum, String line, List<EquipmentImportSummary.RowFailure> failures) {
        if (lifeStr == null || lifeStr.trim().isEmpty()) {
            return null;
        }
        try {
            Integer years = Integer.parseInt(lifeStr.trim());
            if (years <= 0) {
                throw new NumberFormatException("non-positive");
            }
            return years;
        } catch (NumberFormatException e) {
            failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                    "Invalid Useful Life. Expected a positive whole number of years, e.g. 10"));
            return null;
        }
    }

    private com.medtrack.model.DepreciationMethod parseDepreciationMethod(String methodStr, int rowNum, String line, List<EquipmentImportSummary.RowFailure> failures) {
        if (methodStr == null || methodStr.trim().isEmpty()) {
            return com.medtrack.model.DepreciationMethod.STRAIGHT_LINE;
        }

        String method = methodStr.trim();
        if (method.equalsIgnoreCase("DECLINING_BALANCE")
                || method.equalsIgnoreCase("declining balance")
                || method.equalsIgnoreCase("double declining")) {
            return com.medtrack.model.DepreciationMethod.DECLINING_BALANCE;
        } else if (method.equalsIgnoreCase("STRAIGHT_LINE")
                || method.equalsIgnoreCase("straight line")) {
            return com.medtrack.model.DepreciationMethod.STRAIGHT_LINE;
        } else {
            failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                    "Invalid Depreciation Method. Allowed: STRAIGHT_LINE, DECLINING_BALANCE"));
            return null;
        }
    }

    private WarrantyCoverageType parseWarrantyCoverageType(String coverageStr, int rowNum, String line, List<EquipmentImportSummary.RowFailure> failures) {
        if (coverageStr == null || coverageStr.trim().isEmpty()) {
            return null;
        }

        String coverage = coverageStr.trim();
        if (coverage.equalsIgnoreCase("FULL_PARTS_AND_LABOR")
                || coverage.equalsIgnoreCase("full parts and labor")
                || coverage.equalsIgnoreCase("full parts/labor")) {
            return WarrantyCoverageType.FULL_PARTS_AND_LABOR;
        } else if (coverage.equalsIgnoreCase("PARTS_ONLY")
                || coverage.equalsIgnoreCase("parts only")) {
            return WarrantyCoverageType.PARTS_ONLY;
        } else if (coverage.equalsIgnoreCase("LABOR_ONLY")
                || coverage.equalsIgnoreCase("labor only")) {
            return WarrantyCoverageType.LABOR_ONLY;
        } else {
            failures.add(new EquipmentImportSummary.RowFailure(rowNum, line,
                    "Invalid Warranty Coverage Type. Allowed: FULL_PARTS_AND_LABOR, PARTS_ONLY, LABOR_ONLY"));
            return null;
        }
    }

    private boolean validateSerialNumber(String serialNumber, String equipmentCode, Set<String> serialNumbersInFile,
                                         Hospital hospital, int rowNum, String line, List<EquipmentImportSummary.RowFailure> failures) {
        if (serialNumber != null && !serialNumber.trim().isEmpty()) {
            String normalizedSerial = serialNumber.trim();
            if (!serialNumbersInFile.add(normalizedSerial)) {
                failures.add(new EquipmentImportSummary.RowFailure(
                        rowNum, line, "Duplicate Serial Number within this file: " + normalizedSerial));
                return false;
            }
            String rowCode = equipmentCode != null ? equipmentCode.trim() : null;
            Optional<Equipment> serialOwner = equipmentRepository.findBySerialNumber(normalizedSerial);
            if (serialOwner.isPresent()
                    && !(rowCode != null && rowCode.equals(serialOwner.get().getEquipmentCode()))) {
                failures.add(new EquipmentImportSummary.RowFailure(
                        rowNum, line, "Serial Number already exists in inventory: " + normalizedSerial));
                return false;
            }
        }
        return true;
    }

    private String validateEquipmentCode(String equipmentCode, Set<String> equipmentCodesInFile,
                                         int rowNum, String line, List<EquipmentImportSummary.RowFailure> failures) {
        String trimmedCode = equipmentCode != null && !equipmentCode.trim().isEmpty()
                ? equipmentCode.trim()
                : null;

        if (trimmedCode != null && !equipmentCodesInFile.add(trimmedCode)) {
            failures.add(new EquipmentImportSummary.RowFailure(
                    rowNum, line, "Duplicate Equipment Code within this file: " + trimmedCode));
            return null;
        }
        return trimmedCode;
    }

    private Equipment buildEquipment(Equipment existing, String name, String model, String serialNumber,
                                     String department, EquipmentCategory equipmentCategory, EquipmentStatus parsedStatus,
                                     LocalDate purchaseDate, LocalDate warrantyExpiry, BigDecimal purchaseCost,
                                     Integer usefulLifeYears, com.medtrack.model.DepreciationMethod depreciationMethod,
                                     String warrantyProvider, String warrantyContractNumber, LocalDate warrantyStartDate,
                                     WarrantyCoverageType warrantyCoverageType, String warrantyTerms,
                                     String trimmedCode, Hospital hospital) {
        if (existing != null) {
            existing.setName(name);
            existing.setModel(model);
            existing.setSerialNumber(serialNumber);
            existing.setDepartment(department);
            existing.setCategory(equipmentCategory);
            existing.setStatus(parsedStatus);
            existing.setPurchaseDate(purchaseDate);
            existing.setWarrantyExpiry(warrantyExpiry);
            existing.setPurchaseCost(purchaseCost);
            existing.setUsefulLifeYears(usefulLifeYears);
            existing.setDepreciationMethod(depreciationMethod);
            existing.setWarrantyProvider(warrantyProvider);
            existing.setWarrantyContractNumber(warrantyContractNumber);
            existing.setWarrantyStartDate(warrantyStartDate);
            existing.setWarrantyCoverageType(warrantyCoverageType);
            existing.setWarrantyTerms(warrantyTerms);
            return existing;
        } else {
            return Equipment.builder()
                    .name(name)
                    .model(model)
                    .serialNumber(serialNumber)
                    .department(department)
                    .category(equipmentCategory)
                    .status(parsedStatus)
                    .purchaseDate(purchaseDate)
                    .warrantyExpiry(warrantyExpiry)
                    .equipmentCode(trimmedCode != null ? trimmedCode : "EQ-" + UUID.randomUUID())
                    .hospital(hospital)
                    .purchaseCost(purchaseCost)
                    .usefulLifeYears(usefulLifeYears)
                    .depreciationMethod(depreciationMethod)
                    .warrantyProvider(warrantyProvider)
                    .warrantyContractNumber(warrantyContractNumber)
                    .warrantyStartDate(warrantyStartDate)
                    .warrantyCoverageType(warrantyCoverageType)
                    .warrantyTerms(warrantyTerms)
                    .build();
        }
    }

    private Map<String, String> toPreviewRowData(Equipment equipment, String name, String model, String serialNumber,
                                                  String department, EquipmentCategory equipmentCategory, String status,
                                                  LocalDate purchaseDate, LocalDate warrantyExpiry, BigDecimal purchaseCost,
                                                  Integer usefulLifeYears, com.medtrack.model.DepreciationMethod depreciationMethod,
                                                  String warrantyProvider, String warrantyContractNumber, LocalDate warrantyStartDate,
                                                  WarrantyCoverageType warrantyCoverageType, String warrantyTerms) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("Equipment Code", equipment.getEquipmentCode());
        data.put("Name", name);
        data.put("Model", model);
        data.put("Serial Number", serialNumber);
        data.put("Department", department);
        data.put("Category", equipmentCategory.name());
        data.put("Status", status);
        data.put("Purchase Date", purchaseDate != null ? purchaseDate.toString() : "");
        data.put("Warranty Expiry", warrantyExpiry != null ? warrantyExpiry.toString() : "");
        data.put("Purchase Cost", purchaseCost != null ? purchaseCost.toString() : "");
        data.put("Useful Life (Years)", usefulLifeYears != null ? usefulLifeYears.toString() : "");
        data.put("Depreciation Method", depreciationMethod != null ? depreciationMethod.name() : "");
        data.put("Warranty Provider", warrantyProvider != null ? warrantyProvider : "");
        data.put("Warranty Contract Number", warrantyContractNumber != null ? warrantyContractNumber : "");
        data.put("Warranty Start Date", warrantyStartDate != null ? warrantyStartDate.toString() : "");
        data.put("Warranty Coverage Type", warrantyCoverageType != null ? warrantyCoverageType.name() : "");
        data.put("Warranty Terms", warrantyTerms != null ? warrantyTerms : "");
        return data;
    }

    private String failuresToJson(List<EquipmentImportSummary.RowFailure> failures) {
        if (failures == null || failures.isEmpty()) {
            return null;
        }
        StringBuilder json = new StringBuilder("[");
        for (int index = 0; index < failures.size(); index++) {
            EquipmentImportSummary.RowFailure failure = failures.get(index);
            if (index > 0) {
                json.append(',');
            }
            json.append('{')
                    .append("\"rowNumber\":").append(failure.getRowNumber())
                    .append(",\"reason\":\"").append(escapeJson(failure.getReason())).append('"')
                    .append(",\"rowData\":\"").append(escapeJson(failure.getRowData())).append('"')
                    .append('}');
        }
        return json.append(']').toString();
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private List<String> parseCsvLine(String line) {
        return CsvSupport.parseLine(line);
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private String getFieldValue(List<String> fields, List<String> headers, String columnName) {
        for (int i = 0; i < headers.size(); i++) {
            if (headers.get(i).equalsIgnoreCase(columnName)) {
                if (i < fields.size()) {
                    return fields.get(i);
                }
            }
        }
        return null;
    }

    private static class ParsedImport {
        final List<Equipment> equipmentToSave;
        final List<EquipmentImportSummary.RowFailure> failures;
        final List<EquipmentImportPreviewResponse.PreviewRow> validRows;
        final int successCount;
        final int failureCount;

        ParsedImport(List<Equipment> equipmentToSave, List<EquipmentImportSummary.RowFailure> failures,
                    List<EquipmentImportPreviewResponse.PreviewRow> validRows, int successCount, int failureCount) {
            this.equipmentToSave = equipmentToSave;
            this.failures = failures;
            this.validRows = validRows;
            this.successCount = successCount;
            this.failureCount = failureCount;
        }
    }
}
