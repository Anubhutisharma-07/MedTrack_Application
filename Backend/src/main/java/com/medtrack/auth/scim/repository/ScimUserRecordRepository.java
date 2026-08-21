package com.medtrack.auth.scim.repository;

import com.medtrack.auth.scim.model.ScimUserRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScimUserRecordRepository extends JpaRepository<ScimUserRecord, Long> {

    Optional<ScimUserRecord> findByScimId(String scimId);

    Optional<ScimUserRecord> findByExternalId(String externalId);

    Optional<ScimUserRecord> findByUserName(String userName);
}
