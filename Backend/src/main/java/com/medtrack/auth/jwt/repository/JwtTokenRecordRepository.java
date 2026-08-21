package com.medtrack.auth.jwt.repository;

import com.medtrack.auth.jwt.model.JwtTokenRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JwtTokenRecordRepository extends JpaRepository<JwtTokenRecord, Long> {

    Optional<JwtTokenRecord> findByJti(String jti);

    List<JwtTokenRecord> findBySubjectUserId(String subjectUserId);

    List<JwtTokenRecord> findByRevokedFalse();
}
