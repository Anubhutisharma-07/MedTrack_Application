package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.SparePartCreateRequest;
import com.medtrack.dto.SparePartResponse;
import com.medtrack.dto.SparePartStockRequest;
import com.medtrack.dto.SparePartUpdateRequest;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.model.SparePart;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.SparePartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SparePartService {

    private final SparePartRepository sparePartRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    private Hospital getHospitalForUser(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        String identifier = username.trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase(java.util.Locale.ROOT)))
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return hospitalRepository.findByUserId(user.getId())
                .orElseGet(() -> resolveHospitalForTechnician(user, username));
    }

    private Hospital resolveHospitalForTechnician(User user, String username) {
        if ("technician".equalsIgnoreCase(user.getRole())) {
            String organization = user.getOrganization();
            if (organization != null && !organization.isBlank()) {
                List<Hospital> matchingHospitals =
                        hospitalRepository.findByNameIgnoreCaseAndTrimmed(organization.trim());
                if (!matchingHospitals.isEmpty()) {
                    return matchingHospitals.get(0);
                }
            }
            throw new ResourceNotFoundException(
                    "Hospital profile not found for technician organization: "
                            + (user.getOrganization() != null && !user.getOrganization().isBlank() ? user.getOrganization() : "unassigned"));
        }
        throw new ResourceNotFoundException("Hospital profile not found for user: " + username);
    }

    public List<SparePartResponse> getAllSpareParts(String username) {
        Hospital hospital = getHospitalForUser(username);
        return sparePartRepository.findByHospitalIdAndDeletedFalse(hospital.getId()).stream()
                .map(SparePartResponse::from)
                .toList();
    }

    public SparePartResponse getSparePart(Long id, String username) {
        if (id == null) {
            throw new IllegalArgumentException("Spare part ID is required");
        }
        Hospital hospital = getHospitalForUser(username);
        SparePart sparePart = sparePartRepository
                .findByIdAndHospitalIdAndDeletedFalse(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Active spare part not found with ID: " + id));
        return SparePartResponse.from(sparePart);
    }

    public List<SparePartResponse> getLowStockAlerts(String username) {
        Hospital hospital = getHospitalForUser(username);
        return sparePartRepository.findLowStockPartsByHospitalId(hospital.getId()).stream()
                .map(SparePartResponse::from)
                .toList();
    }

    @Transactional
    public SparePartResponse createSparePart(SparePartCreateRequest request, String username) {
        Hospital hospital = getHospitalForUser(username);
        validateUpsert(null, request.getPartNumber(), request.getDescription(), request.getStockLevel(),
                request.getReorderPoint(), request.getUnitCost(), hospital.getId());

        SparePart sparePart = SparePart.builder()
                .hospitalId(hospital.getId())
                .partNumber(request.getPartNumber().trim())
                .description(request.getDescription().trim())
                .compatibleModels(trimToNull(request.getCompatibleModels()))
                .stockLevel(request.getStockLevel())
                .reorderPoint(request.getReorderPoint())
                .unitCost(request.getUnitCost())
                .createdAt(LocalDateTime.now())
                .build();

        return SparePartResponse.from(sparePartRepository.save(sparePart));
    }

    @Transactional
    public SparePart createSparePart(SparePart sparePart, String username) {
        if (sparePart == null) throw new IllegalArgumentException("Spare part details are required");
        Hospital hospital = getHospitalForUser(username);
        validateSparePart(sparePart);

        String trimmedPartNumber = sparePart.getPartNumber().trim();
        if (sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(hospital.getId(), trimmedPartNumber)) {
            throw new IllegalArgumentException("Spare part with part number already exists: " + trimmedPartNumber);
        }

        sparePart.setHospitalId(hospital.getId());
        sparePart.setPartNumber(trimmedPartNumber);
        sparePart.setDescription(sparePart.getDescription().trim());
        return sparePartRepository.save(sparePart);
    }

    @Transactional
    public SparePartResponse updateSparePart(Long id, SparePartUpdateRequest request, String username) {
        Hospital hospital = getHospitalForUser(username);
        SparePart existing = sparePartRepository.findByIdAndHospitalIdForUpdate(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Spare Part not found or access denied"));

        validateUpsert(id, request.getPartNumber(), request.getDescription(), request.getStockLevel(),
                request.getReorderPoint(), request.getUnitCost(), hospital.getId());

        existing.setPartNumber(request.getPartNumber().trim());
        existing.setDescription(request.getDescription().trim());
        existing.setCompatibleModels(trimToNull(request.getCompatibleModels()));
        existing.setStockLevel(request.getStockLevel());
        existing.setReorderPoint(request.getReorderPoint());
        existing.setUnitCost(request.getUnitCost());

        return SparePartResponse.from(sparePartRepository.save(existing));
    }

    @Transactional
    public SparePart updateSparePart(Long id, SparePart updateRequest, String username) {
        if (updateRequest == null) throw new IllegalArgumentException("Update details are required");
        Hospital hospital = getHospitalForUser(username);
        SparePart existing = sparePartRepository.findByIdAndHospitalIdForUpdate(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Spare Part not found or access denied"));

        validateSparePart(updateRequest);

        String updatedPartNumber = updateRequest.getPartNumber().trim();
        if (!existing.getPartNumber().equalsIgnoreCase(updatedPartNumber)
                && sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(hospital.getId(), updatedPartNumber)) {
            throw new IllegalArgumentException("Spare part with part number already exists: " + updatedPartNumber);
        }

        existing.setPartNumber(updatedPartNumber);
        existing.setDescription(updateRequest.getDescription().trim());
        existing.setCompatibleModels(updateRequest.getCompatibleModels());
        existing.setStockLevel(updateRequest.getStockLevel());
        existing.setReorderPoint(updateRequest.getReorderPoint());
        existing.setUnitCost(updateRequest.getUnitCost());

        return sparePartRepository.save(existing);
    }

    @Transactional
    public void deleteSparePart(Long id, String username) {
        Hospital hospital = getHospitalForUser(username);
        SparePart existing = sparePartRepository.findByIdAndHospitalIdForUpdate(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Spare Part not found or access denied"));

        existing.setDeleted(true);
        existing.setDeletedAt(LocalDateTime.now());
        existing.setDeletedBy(username);
        sparePartRepository.save(existing);
    }

    @Transactional
    public SparePartResponse deductStock(SparePartStockRequest request, String username) {
        return adjustStock(request, username, StockAdjustment.DEDUCT);
    }

    @Transactional
    public SparePartResponse restockSparePart(SparePartStockRequest request, String username) {
        return adjustStock(request, username, StockAdjustment.RESTOCK);
    }

    private SparePartResponse adjustStock(
            SparePartStockRequest request,
            String username,
            StockAdjustment adjustment) {
        if (request == null) {
            throw new IllegalArgumentException("Stock request details are required");
        }
        if (request.getPartNumber() == null || request.getPartNumber().isBlank()) {
            throw new IllegalArgumentException("Part number is required for stock adjustment");
        }
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Stock adjustment quantity must be greater than zero");
        }

        Hospital hospital = getHospitalForUser(username);
        String partNumber = request.getPartNumber().trim();

        SparePart part = sparePartRepository
                .findActiveByHospitalIdAndPartNumberForUpdate(hospital.getId(), partNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Active spare part not found: " + partNumber));

        int updatedLevel;
        if (adjustment == StockAdjustment.DEDUCT) {
            if (part.getStockLevel() < request.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for part: " + partNumber
                        + ". Available: " + part.getStockLevel()
                        + ", Requested: " + request.getQuantity());
            }
            updatedLevel = part.getStockLevel() - request.getQuantity();
        } else {
            try {
                updatedLevel = Math.addExact(part.getStockLevel(), request.getQuantity());
            } catch (ArithmeticException exception) {
                throw new IllegalArgumentException("Stock level exceeds supported maximum for part: "
                        + partNumber, exception);
            }
        }

        part.setStockLevel(updatedLevel);
        return SparePartResponse.from(sparePartRepository.save(part));
    }

    @Transactional
    public void deductSparePartsForWorkOrder(
            List<com.medtrack.dto.SparePartDeductionItem> items,
            Long hospitalId,
            String username) {
        if (items == null || items.isEmpty() || hospitalId == null) {
            return;
        }

        Map<String, Integer> aggregatedQuantities = new LinkedHashMap<>();
        Map<String, String> displayPartNumbers = new LinkedHashMap<>();

        for (com.medtrack.dto.SparePartDeductionItem item : items) {
            if (item == null || item.getPartNumber() == null || item.getPartNumber().isBlank()) {
                continue;
            }
            String trimmed = item.getPartNumber().trim();
            String normalizedKey = trimmed.toUpperCase(Locale.ROOT);
            int quantity = item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1;

            aggregatedQuantities.put(normalizedKey, aggregatedQuantities.getOrDefault(normalizedKey, 0) + quantity);
            displayPartNumbers.putIfAbsent(normalizedKey, trimmed);
        }

        for (Map.Entry<String, Integer> entry : aggregatedQuantities.entrySet()) {
            String normalizedKey = entry.getKey();
            String displayPartNumber = displayPartNumbers.get(normalizedKey);
            int requiredQuantity = entry.getValue();

            SparePart part = sparePartRepository
                    .findActiveByHospitalIdAndPartNumberForUpdate(hospitalId, displayPartNumber)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Spare part with part number '" + displayPartNumber + "' not found in hospital inventory"));

            if (part.getStockLevel() < requiredQuantity) {
                throw new IllegalArgumentException("Insufficient stock for spare part: " + displayPartNumber
                        + ". Available: " + part.getStockLevel() + ", Required: " + requiredQuantity);
            }

            part.setStockLevel(part.getStockLevel() - requiredQuantity);
            sparePartRepository.save(part);
        }
    }

    /**
     * Executes bulk import of spare part records from a CSV file.
     *
     * <p>Header row names are dynamically resolved to map fields ('Part Number', 'Name'/'Description',
     * 'Quantity'/'Stock Level', 'Minimum Stock'/'Reorder Point', 'Unit Cost', 'Compatible Models')
     * to their respective column indices. If headers are absent, positional mapping is used with
     * safe type validation for optional cost and model columns.</p>
     *
     * @param file CSV file payload
     * @param username acting user's username or email
     * @return import summary detailing total, success, and failure counts
     */
    @Transactional
    public com.medtrack.dto.SparePartImportSummary bulkImport(org.springframework.web.multipart.MultipartFile file, String username) {
        Hospital hospital = getHospitalForUser(username);
        com.medtrack.dto.SparePartImportSummary summary = new com.medtrack.dto.SparePartImportSummary();
        summary.setFailures(new java.util.ArrayList<>());

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty");
        }

        String csvContent;
        try {
            csvContent = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
        } catch (java.io.IOException e) {
            throw new IllegalArgumentException("Failed to read file", e);
        }

        java.util.List<String> records;
        try {
            records = com.medtrack.util.CsvSupport.splitRecords(csvContent);
        } catch (com.medtrack.util.CsvSupport.MalformedCsvException e) {
            throw new IllegalArgumentException("Malformed CSV: " + e.getMessage());
        }

        if (records.isEmpty()) {
            throw new IllegalArgumentException("CSV file contains no records");
        }

        int startIndex = 0;
        java.util.List<String> firstRow = com.medtrack.util.CsvSupport.parseLine(records.get(0));
        SparePartCsvHeaderMap headerMap;

        if (!firstRow.isEmpty() && isHeaderRow(firstRow)) {
            startIndex = 1;
            headerMap = SparePartCsvHeaderMap.fromHeaderRow(firstRow);
        } else {
            headerMap = SparePartCsvHeaderMap.defaultPositional();
        }

        java.util.List<SparePart> validParts = new java.util.ArrayList<>();
        int processedRows = 0;

        for (int i = startIndex; i < records.size(); i++) {
            processedRows++;
            String rowData = records.get(i);
            try {
                java.util.List<String> fields = com.medtrack.util.CsvSupport.parseLine(rowData);
                if (fields.size() < 4) {
                    summary.getFailures().add(new com.medtrack.dto.SparePartImportSummary.RowFailure(
                            processedRows, rowData, "Insufficient columns. Expected at least 4."));
                    continue;
                }

                String partNumber = getFieldValue(fields, headerMap.partNumberIndex());
                String description = getFieldValue(fields, headerMap.descriptionIndex());
                String quantityStr = getFieldValue(fields, headerMap.quantityIndex());
                String minStockStr = getFieldValue(fields, headerMap.reorderPointIndex());

                if (partNumber == null || description == null || quantityStr == null || minStockStr == null) {
                    summary.getFailures().add(new com.medtrack.dto.SparePartImportSummary.RowFailure(
                            processedRows, rowData, "Missing required fields"));
                    continue;
                }

                int stockLevel;
                int reorderPoint;
                try {
                    stockLevel = Integer.parseInt(quantityStr);
                    reorderPoint = Integer.parseInt(minStockStr);
                } catch (NumberFormatException e) {
                    summary.getFailures().add(new com.medtrack.dto.SparePartImportSummary.RowFailure(
                            processedRows, rowData, "Quantity and minimum stock must be numeric"));
                    continue;
                }

                if (stockLevel < 0 || reorderPoint < 0) {
                    summary.getFailures().add(new com.medtrack.dto.SparePartImportSummary.RowFailure(
                            processedRows, rowData, "Quantity and minimum stock cannot be negative"));
                    continue;
                }

                Double unitCost = extractUnitCost(fields, headerMap, summary, processedRows, rowData);
                if (unitCost == null) {
                    // Row failure was appended inside extractUnitCost
                    continue;
                }

                String compatibleModels = null;
                Integer modelIdx = headerMap.compatibleModelsIndex();
                if (modelIdx != null && modelIdx < fields.size()) {
                    compatibleModels = trimToNull(fields.get(modelIdx));
                }

                final String pNum = partNumber;
                if (validParts.stream().anyMatch(p -> p.getPartNumber().equalsIgnoreCase(pNum))) {
                    summary.getFailures().add(new com.medtrack.dto.SparePartImportSummary.RowFailure(
                            processedRows, rowData, "Duplicate part number in import file"));
                    continue;
                }

                if (sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(hospital.getId(), partNumber)) {
                    summary.getFailures().add(new com.medtrack.dto.SparePartImportSummary.RowFailure(
                            processedRows, rowData, "Spare part with part number already exists"));
                    continue;
                }

                SparePart part = SparePart.builder()
                        .hospitalId(hospital.getId())
                        .partNumber(partNumber)
                        .description(description)
                        .compatibleModels(compatibleModels)
                        .stockLevel(stockLevel)
                        .reorderPoint(reorderPoint)
                        .unitCost(unitCost)
                        .createdAt(java.time.LocalDateTime.now())
                        .deleted(false)
                        .build();

                validParts.add(part);
            } catch (Exception e) {
                summary.getFailures().add(new com.medtrack.dto.SparePartImportSummary.RowFailure(
                        processedRows, rowData, e.getMessage() != null ? e.getMessage() : "Invalid data"));
            }
        }

        if (!validParts.isEmpty()) {
            sparePartRepository.saveAll(validParts);
        }

        summary.setTotalRows(processedRows);
        summary.setSuccessCount(validParts.size());
        summary.setFailureCount(summary.getFailures().size());

        return summary;
    }

    private Double extractUnitCost(
            java.util.List<String> fields,
            SparePartCsvHeaderMap headerMap,
            com.medtrack.dto.SparePartImportSummary summary,
            int processedRows,
            String rowData) {

        Double unitCost = 0.0;
        Integer costIdx = headerMap.unitCostIndex();

        if (costIdx != null && costIdx < fields.size()) {
            String costStr = trimToNull(fields.get(costIdx));
            if (costStr != null) {
                try {
                    unitCost = Double.parseDouble(costStr);
                    if (unitCost < 0.0 || !Double.isFinite(unitCost)) {
                        summary.getFailures().add(new com.medtrack.dto.SparePartImportSummary.RowFailure(
                                processedRows, rowData, "Unit cost must be a non-negative finite number"));
                        return null;
                    }
                } catch (NumberFormatException e) {
                    summary.getFailures().add(new com.medtrack.dto.SparePartImportSummary.RowFailure(
                            processedRows, rowData, "Unit cost must be numeric"));
                    return null;
                }
            }
        } else if (headerMap.isPositional() && fields.size() >= 5) {
            String possibleCost = trimToNull(fields.get(4));
            if (possibleCost != null && isNumericDouble(possibleCost)) {
                unitCost = Double.parseDouble(possibleCost);
                if (unitCost < 0.0 || !Double.isFinite(unitCost)) {
                    summary.getFailures().add(new com.medtrack.dto.SparePartImportSummary.RowFailure(
                            processedRows, rowData, "Unit cost must be a non-negative finite number"));
                    return null;
                }
            }
        }

        return unitCost;
    }

    private boolean isHeaderRow(java.util.List<String> row) {
        if (row == null || row.isEmpty()) return false;
        String line = String.join(" ", row).toLowerCase(java.util.Locale.ROOT);
        return line.contains("part") || line.contains("name") || line.contains("quantity") || line.contains("stock");
    }

    private String getFieldValue(java.util.List<String> fields, Integer index) {
        if (fields == null || index == null || index < 0 || index >= fields.size()) {
            return null;
        }
        return trimToNull(fields.get(index));
    }

    private boolean isNumericDouble(String value) {
        if (value == null || value.isBlank()) return false;
        try {
            double d = Double.parseDouble(value);
            return Double.isFinite(d);
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Internal encapsulation record representing mapped header column indices for spare part bulk import.
     */
    private record SparePartCsvHeaderMap(
            Integer partNumberIndex,
            Integer descriptionIndex,
            Integer quantityIndex,
            Integer reorderPointIndex,
            Integer unitCostIndex,
            Integer compatibleModelsIndex,
            boolean isPositional) {

        public static SparePartCsvHeaderMap defaultPositional() {
            return new SparePartCsvHeaderMap(0, 1, 2, 3, 4, null, true);
        }

        public static SparePartCsvHeaderMap fromHeaderRow(java.util.List<String> headers) {
            Integer partNum = null;
            Integer desc = null;
            Integer qty = null;
            Integer minStock = null;
            Integer cost = null;
            Integer models = null;

            for (int i = 0; i < headers.size(); i++) {
                String header = headers.get(i).trim().toLowerCase(java.util.Locale.ROOT);
                if (isPartNumberHeader(header)) {
                    if (partNum == null) partNum = i;
                } else if (isDescriptionHeader(header)) {
                    if (desc == null) desc = i;
                } else if (isQuantityHeader(header)) {
                    if (qty == null) qty = i;
                } else if (isReorderPointHeader(header)) {
                    if (minStock == null) minStock = i;
                } else if (isUnitCostHeader(header)) {
                    if (cost == null) cost = i;
                } else if (isCompatibleModelsHeader(header)) {
                    if (models == null) models = i;
                }
            }

            if (partNum == null) partNum = 0;
            if (desc == null) desc = 1;
            if (qty == null) qty = 2;
            if (minStock == null) minStock = 3;

            return new SparePartCsvHeaderMap(partNum, desc, qty, minStock, cost, models, false);
        }

        /**
         * Validates that all mandatory spare part fields have resolved column indices.
         *
         * @return true if mandatory header fields are mapped
         */
        public boolean hasValidMandatoryHeaders() {
            return partNumberIndex != null && descriptionIndex != null
                    && quantityIndex != null && reorderPointIndex != null;
        }

        /**
         * Returns a human-readable log summary of resolved CSV column indices.
         *
         * @return formatted mapping summary string
         */
        public String toMappingSummary() {
            return String.format(
                    "CSV Header Mapping [PartNumber: %d, Description: %d, Quantity: %d, ReorderPoint: %d, UnitCost: %s, CompatibleModels: %s, Positional: %b]",
                    partNumberIndex, descriptionIndex, quantityIndex, reorderPointIndex,
                    unitCostIndex != null ? unitCostIndex.toString() : "N/A",
                    compatibleModelsIndex != null ? compatibleModelsIndex.toString() : "N/A",
                    isPositional);
        }

        private static boolean isPartNumberHeader(String h) {
            return h.contains("part") && (h.contains("num") || h.contains("code") || h.contains("#") || h.equals("part number") || h.equals("partnumber") || h.equals("part_number"));
        }

        private static boolean isDescriptionHeader(String h) {
            return h.contains("name") || h.contains("desc") || h.contains("item") || h.contains("title");
        }

        private static boolean isQuantityHeader(String h) {
            return h.contains("quantity") || h.contains("qty") || (h.contains("stock") && !h.contains("min") && !h.contains("reorder"));
        }

        private static boolean isReorderPointHeader(String h) {
            return h.contains("min") || h.contains("reorder") || h.contains("threshold");
        }

        private static boolean isUnitCostHeader(String h) {
            return h.contains("cost") || h.contains("price") || h.contains("unit");
        }

        private static boolean isCompatibleModelsHeader(String h) {
            return h.contains("model") || h.contains("compatib");
        }
    }

private void validateSparePart(SparePart sparePart) {
        if (sparePart == null) {
            throw new IllegalArgumentException("Spare part payload is required");
        }
        if (sparePart.getPartNumber() == null || sparePart.getPartNumber().isBlank()) {
            throw new IllegalArgumentException("Part number is required");
        }
        if (sparePart.getDescription() == null || sparePart.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (sparePart.getStockLevel() == null || sparePart.getStockLevel() < 0) {
            throw new IllegalArgumentException("Stock level cannot be negative");
        }
        if (sparePart.getReorderPoint() == null || sparePart.getReorderPoint() < 0) {
            throw new IllegalArgumentException("Reorder point cannot be negative");
        }
        if (sparePart.getUnitCost() == null
                || !Double.isFinite(sparePart.getUnitCost())
                || sparePart.getUnitCost() < 0.0) {
            throw new IllegalArgumentException("Unit cost must be a finite non-negative value");
        }
    }

    private void validateUpsert(
            Long id,
            String partNumber,
            String description,
            Integer stockLevel,
            Integer reorderPoint,
            Double unitCost,
            Long hospitalId) {
        validateSparePart(SparePart.builder()
                .partNumber(partNumber)
                .description(description)
                .stockLevel(stockLevel)
                .reorderPoint(reorderPoint)
                .unitCost(unitCost)
                .build());
        String normalizedPartNumber = partNumber.trim();
        boolean duplicate = id == null
                ? sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(
                        hospitalId, normalizedPartNumber)
                : sparePartRepository.existsByHospitalIdAndPartNumberAndIdNotAndDeletedFalse(
                        hospitalId, normalizedPartNumber, id);
        if (duplicate) {
            throw new IllegalArgumentException(
                    "Spare part with part number already exists: " + normalizedPartNumber);
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private enum StockAdjustment {
        DEDUCT,
        RESTOCK
    }
}
