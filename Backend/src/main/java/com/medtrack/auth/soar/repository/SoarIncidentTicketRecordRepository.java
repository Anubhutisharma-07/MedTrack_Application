package com.medtrack.auth.soar.repository;

import com.medtrack.auth.soar.model.SoarIncidentTicketRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SoarIncidentTicketRecordRepository extends JpaRepository<SoarIncidentTicketRecord, Long> {

    Optional<SoarIncidentTicketRecord> findByTicketId(String ticketId);

    List<SoarIncidentTicketRecord> findByStatus(String status);

    List<SoarIncidentTicketRecord> findBySeverity(String severity);
}
