package com.medtrack.analytics.repository;

import com.medtrack.analytics.model.IncidentStatus;
import com.medtrack.analytics.model.SecurityIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SecurityIncidentRepository extends JpaRepository<SecurityIncident, UUID> {

    /**
     * Finds open security alerts for a specific equipment and incident type.
     * Used to prevent duplicate alerts for ongoing geofence violations (issue #1228).
     *
     * @param equipmentId the equipment identifier
     * @param incidentType the incident type (e.g., "SECURITY_ALERT")
     * @param status the incident status (e.g., OPEN)
     * @return list of matching incidents
     */
    List<SecurityIncident> findByEquipmentIdAndIncidentTypeAndStatus(
            Long equipmentId, String incidentType, IncidentStatus status);
}
