package com.medtrack.auth.fido2.repository;

import com.medtrack.auth.fido2.model.Fido2WebAuthnRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Fido2WebAuthnRecordRepository extends JpaRepository<Fido2WebAuthnRecord, Long> {

    Optional<Fido2WebAuthnRecord> findByCredentialId(String credentialId);

    List<Fido2WebAuthnRecord> findByUserId(String userId);
}
