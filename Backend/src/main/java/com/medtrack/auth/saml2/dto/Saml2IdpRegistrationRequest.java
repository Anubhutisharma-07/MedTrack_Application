package com.medtrack.auth.saml2.dto;

public class Saml2IdpRegistrationRequest {

    private String idpEntityId;
    private String idpName;
    private String ssoRedirectUrl;
    private String x509CertificatePem;
    private String nameIdFormat;

    public Saml2IdpRegistrationRequest() {}

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
}
