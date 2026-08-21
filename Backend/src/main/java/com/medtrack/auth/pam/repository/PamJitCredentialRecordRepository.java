package com.medtrack.auth.pam.repository;

import com.medtrack.auth.pam.model.PamJitCredentialRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PamJitCredentialRecordRepository extends JpaRepository<PamJitCredentialRecord, Long> {

    Optional<PamJitCredentialRecord> findByElevationId(String elevationId);

    List<PamJitCredentialRecord> findByRequesterUserId(String requesterUserId);

    List<PamJitCredentialRecord> findByApprovalStatus(String approvalStatus);
}
