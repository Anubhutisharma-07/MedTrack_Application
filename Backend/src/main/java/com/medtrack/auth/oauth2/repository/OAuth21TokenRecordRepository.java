package com.medtrack.auth.oauth2.repository;

import com.medtrack.auth.oauth2.model.OAuth21TokenRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OAuth21TokenRecordRepository extends JpaRepository<OAuth21TokenRecord, Long> {

    Optional<OAuth21TokenRecord> findByTokenId(String tokenId);

    List<OAuth21TokenRecord> findBySubjectUserId(String subjectUserId);

    List<OAuth21TokenRecord> findByRevokedFalse();
}
