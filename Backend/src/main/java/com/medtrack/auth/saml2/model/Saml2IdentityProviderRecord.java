package com.medtrack.auth.saml2.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Saml2IdentityProviderRecord JPA Entity
 * Represents an Enterprise SAML 2.0 Identity Provider (Okta, Azure AD / Entra ID, PingFederate, Shibboleth)
 * with X.509 signing certificates, SP/IdP Entity IDs, and Assertion Consumer Service (ACS) bindings.
 */
@Entity
@Table(name = "saml2_identity_providers")
public class Saml2IdentityProviderRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String idpEntityId; // e.g. https://idp.mayoclinic.org/saml2/metadata

    @Column(nullable = false)
    private String idpName; // e.g. Mayo Clinic Enterprise Okta

    @Column(nullable = false)
    private String ssoRedirectUrl; // IdP HTTP-Redirect SSO Endpoint

    @Column(columnDefinition = "TEXT", nullable = false)
    private String x509CertificatePem; // IdP X.509 Signing Certificate

    @Column(nullable = false)
    private String nameIdFormat; // urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress

    @Column(nullable = false)
    private boolean signAuthnRequest;

    @Column(nullable = false)
    private boolean requireSignedAssertions;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private Instant registeredAt;

    public Saml2IdentityProviderRecord() {}

    public Saml2IdentityProviderRecord(String idpEntityId, String idpName, String ssoRedirectUrl,
                                      String x509CertificatePem, String nameIdFormat,
                                      boolean signAuthnRequest, boolean requireSignedAssertions,
                                      Instant registeredAt) {
        this.idpEntityId = idpEntityId;
        this.idpName = idpName;
        this.ssoRedirectUrl = ssoRedirectUrl;
        this.x509CertificatePem = x509CertificatePem;
        this.nameIdFormat = nameIdFormat;
        this.signAuthnRequest = signAuthnRequest;
        this.requireSignedAssertions = requireSignedAssertions;
        this.active = true;
        this.registeredAt = registeredAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getIdpEntityId() { return idpEntityId; }
    public void setIdpEntityId(String idpEntityId) { this.idpEntityId = idpEntityId; }

    public String getIdpName() { return idpName; }
    public void setIdpName(String idpName) { this.idpName = idpName; }

    public String getSsoRedirectUrl() { return ssoRedirectUrl; }
    public void setSsoRedirectUrl(String ssoRedirectUrl) { this.ssoRedirectUrl = ssoRedirectUrl; }

    public String getX509CertificatePem() { return x509CertificatePem; }
    public void setX509CertificatePem(String x509CertificatePem) { this.x509CertificatePem = x509CertificatePem; }

    public String getNameIdFormat() { return nameIdFormat; }
    public void setNameIdFormat(String nameIdFormat) { this.nameIdFormat = nameIdFormat; }

    public boolean isSignAuthnRequest() { return signAuthnRequest; }
    public void setSignAuthnRequest(boolean signAuthnRequest) { this.signAuthnRequest = signAuthnRequest; }

    public boolean isRequireSignedAssertions() { return requireSignedAssertions; }
    public void setRequireSignedAssertions(boolean requireSignedAssertions) { this.requireSignedAssertions = requireSignedAssertions; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(Instant registeredAt) { this.registeredAt = registeredAt; }
}
