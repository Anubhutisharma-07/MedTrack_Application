package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.PredictiveRestockItemResponse;
import com.medtrack.dto.PredictiveSupplyForecastResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Hospital;
import com.medtrack.model.SparePart;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.SparePartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.logging.Logger;

@Service
@RequiredArgsConstructor
public class PredictiveSupplyService {
    private static final Logger logger = Logger.getLogger(PredictiveSupplyService.class.getName());
    private static final double SAFETY_MARGIN = 1.5;
    private static final double DEFAULT_VELOCITY_RATE = 0.05;
    private static final double REORDER_THRESHOLD = 10.0;
    private static final double BUFFER_STOCK = 50.0;

    private final SparePartRepository sparePartRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<PredictiveSupplyForecastResponse> getDemandForecasts(String username) {
        Hospital hospital = getHospitalForUser(username);
        List<SparePart> items = sparePartRepository.findByHospitalIdAndDeletedFalse(hospital.getId());
        List<PredictiveSupplyForecastResponse> forecasts = new ArrayList<>();
        for (SparePart item : items) {
            double velocity = calculateVelocity(item);
            double seasonality = getSeasonalityMultiplier(item, LocalDate.now().getMonthValue());
            double predictedShortage = velocity * seasonality * SAFETY_MARGIN;
            forecasts.add(PredictiveSupplyForecastResponse.from(item, velocity, seasonality, predictedShortage));
        }
        return forecasts;
    }

    @Transactional(readOnly = true)
    public List<PredictiveRestockItemResponse> getRestockAlerts(String username) {
        Hospital hospital = getHospitalForUser(username);
        List<SparePart> items = sparePartRepository.findByHospitalIdAndDeletedFalse(hospital.getId());
        List<PredictiveRestockItemResponse> alerts = new ArrayList<>();
        for (SparePart item : items) {
            double velocity = calculateVelocity(item);
            double seasonality = getSeasonalityMultiplier(item, LocalDate.now().getMonthValue());
            double predictedDemand = velocity * seasonality * SAFETY_MARGIN;
            int currentStock = item.getStockLevel() != null ? item.getStockLevel() : 0;
            if ((currentStock - predictedDemand) < REORDER_THRESHOLD) {
                int reorderAmount = (int) Math.ceil(predictedDemand - currentStock + BUFFER_STOCK);
                alerts.add(PredictiveRestockItemResponse.from(item, predictedDemand, Math.max(reorderAmount, 1)));
            }
        }
        return alerts;
    }

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void automatedRestockingJob() {
        logger.info("Executing scheduled predictive supply restocking check.");
        List<SparePart> items = sparePartRepository.findAll();
        for (SparePart item : items) {
            if (Boolean.TRUE.equals(item.getDeleted())) continue;
            double velocity = calculateVelocity(item);
            double seasonality = getSeasonalityMultiplier(item, LocalDate.now().getMonthValue());
            double predictedDemand = velocity * seasonality * SAFETY_MARGIN;
            int currentStock = item.getStockLevel() != null ? item.getStockLevel() : 0;
            if ((currentStock - predictedDemand) < REORDER_THRESHOLD) {
                int reorderAmount = (int) Math.ceil(predictedDemand - currentStock + BUFFER_STOCK);
                logger.info(String.format(Locale.ROOT, "Predictive alert for part %d (%s): reorder %d units",
                        item.getId(), item.getPartNumber(), reorderAmount));
            }
        }
    }

    public double calculateVelocity(SparePart item) {
        if (item == null || item.getStockLevel() == null || item.getStockLevel() <= 0) return 0.0;
        return item.getStockLevel() * DEFAULT_VELOCITY_RATE;
    }

    public double getSeasonalityMultiplier(SparePart item, int currentMonth) {
        if (currentMonth >= 10 || currentMonth <= 2) return 1.3;
        return 1.0;
    }

    private Hospital getHospitalForUser(String username) {
        if (username == null || username.isBlank()) throw new IllegalArgumentException("Username is required");
        String identifier = username.trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase(Locale.ROOT)))
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return hospitalRepository.findByUserId(user.getId())
                .orElseGet(() -> resolveHospitalForTechnician(user, username));
    }

    private Hospital resolveHospitalForTechnician(User user, String username) {
        if ("technician".equalsIgnoreCase(user.getRole())) {
            String org = user.getOrganization();
            if (org != null && !org.isBlank()) {
                List<Hospital> matching = hospitalRepository.findByNameIgnoreCaseAndTrimmed(org.trim());
                if (!matching.isEmpty()) return matching.get(0);
            }
        }
        throw new ResourceNotFoundException("Hospital profile not found for user: " + username);
    }
}
