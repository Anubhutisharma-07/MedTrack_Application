package com.medtrack.auth.fido2.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * FIDO2WebAuthnRecord JPA Entity
 * Represents registered FIDO2 / WebAuthn Biometric & Hardware Security Key authenticators
 * (YubiKey, Apple TouchID/FaceID, Windows Hello) with AAGUID tracking, COSE public key, and sign counter.
 */
@Entity
@Table(name = "fido2_webauthn_records")
public class Fido2WebAuthnRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String credentialId; // Base64URL encoded credential ID

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String authenticatorName; // e.g. YubiKey 5 NFC, Apple Touch ID

    @Column(nullable = false)
    private String aaguid; // Authenticator Attestation GUID

    @Column(columnDefinition = "TEXT", nullable = false)
    private String cosePublicKey; // COSE Key (ES256 / RS256)

    @Column(nullable = false)
    private long signCount; // Counter for clone detection

    @Column(nullable = false)
    private boolean residentKey; // Discoverable credential

    @Column(nullable = false)
    private boolean userPresent;

    @Column(nullable = false)
    private boolean userVerified; // Biometric UV flag

    @Column(nullable = false)
    private Instant registeredAt;

    private Instant lastUsedAt;

    public Fido2WebAuthnRecord() {}

    public Fido2WebAuthnRecord(String credentialId, String userId, String authenticatorName, String aaguid,
                               String cosePublicKey, long signCount, boolean residentKey,
                               boolean userPresent, boolean userVerified, Instant registeredAt) {
        this.credentialId = credentialId;
        this.userId = userId;
        this.authenticatorName = authenticatorName;
        this.aaguid = aaguid;
        this.cosePublicKey = cosePublicKey;
        this.signCount = signCount;
        this.residentKey = residentKey;
        this.userPresent = userPresent;
        this.userVerified = userVerified;
        this.registeredAt = registeredAt;
        this.lastUsedAt = registeredAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getCredentialId() { return credentialId; }
    public void setCredentialId(String credentialId) { this.credentialId = credentialId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getAuthenticatorName() { return authenticatorName; }
    public void setAuthenticatorName(String authenticatorName) { this.authenticatorName = authenticatorName; }

    public String getAaguid() { return aaguid; }
    public void setAaguid(String aaguid) { this.aaguid = aaguid; }

    public String getCosePublicKey() { return cosePublicKey; }
    public void setCosePublicKey(String cosePublicKey) { this.cosePublicKey = cosePublicKey; }

    public long getSignCount() { return signCount; }
    public void setSignCount(long signCount) { this.signCount = signCount; }

    public boolean isResidentKey() { return residentKey; }
    public void setResidentKey(boolean residentKey) { this.residentKey = residentKey; }

    public boolean isUserPresent() { return userPresent; }
    public void setUserPresent(boolean userPresent) { this.userPresent = userPresent; }

    public boolean isUserVerified() { return userVerified; }
    public void setUserVerified(boolean userVerified) { this.userVerified = userVerified; }

    public Instant getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(Instant registeredAt) { this.registeredAt = registeredAt; }

    public Instant getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(Instant lastUsedAt) { this.lastUsedAt = lastUsedAt; }
}
