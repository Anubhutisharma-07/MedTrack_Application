package com.medtrack.auth.scim.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * ScimUserRecord JPA Entity
 * Represents a SCIM 2.0 Provisioned User Resource under RFC 7643 / RFC 7644 standards
 * for Identity Provider enterprise synchronization (Okta, Azure AD, OneLogin).
 */
@Entity
@Table(name = "scim_user_records")
public class ScimUserRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String scimId; // UUID assigned by SCIM Service Provider

    @Column(nullable = false, unique = true)
    private String externalId; // IdP Unique User Identifier (Okta / Azure AD GUID)

    @Column(nullable = false, unique = true)
    private String userName; // Principal Email / Username

    @Column(nullable = false)
    private String givenName;

    @Column(nullable = false)
    private String familyName;

    @Column(nullable = false)
    private String primaryEmail;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant lastModifiedAt;

    public ScimUserRecord() {}

    public ScimUserRecord(String scimId, String externalId, String userName, String givenName,
                          String familyName, String primaryEmail, String department, String title,
                          Instant createdAt) {
        this.scimId = scimId;
        this.externalId = externalId;
        this.userName = userName;
        this.givenName = givenName;
        this.familyName = familyName;
        this.primaryEmail = primaryEmail;
        this.department = department;
        this.title = title;
        this.active = true;
        this.createdAt = createdAt;
        this.lastModifiedAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getScimId() { return scimId; }
    public void setScimId(String scimId) { this.scimId = scimId; }

    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getGivenName() { return givenName; }
    public void setGivenName(String givenName) { this.givenName = givenName; }

    public String getFamilyName() { return familyName; }
    public void setFamilyName(String familyName) { this.familyName = familyName; }

    public String getPrimaryEmail() { return primaryEmail; }
    public void setPrimaryEmail(String primaryEmail) { this.primaryEmail = primaryEmail; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getLastModifiedAt() { return lastModifiedAt; }
    public void setLastModifiedAt(Instant lastModifiedAt) { this.lastModifiedAt = lastModifiedAt; }
}
