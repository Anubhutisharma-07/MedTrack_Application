package com.medtrack.auth.saml2.repository;

import com.medtrack.auth.saml2.model.Saml2IdentityProviderRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Saml2IdentityProviderRecordRepository extends JpaRepository<Saml2IdentityProviderRecord, Long> {

    Optional<Saml2IdentityProviderRecord> findByIdpEntityId(String idpEntityId);

    List<Saml2IdentityProviderRecord> findByActiveTrue();
}
