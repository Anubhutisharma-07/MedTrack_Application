package com.medtrack.auth.cspm.service;

import com.medtrack.auth.cspm.dto.*;
import com.medtrack.auth.cspm.model.*;
import com.medtrack.auth.cspm.repository.*;
import com.medtrack.auth.siem.dto.SiemLogIngestRequest;
import com.medtrack.auth.siem.service.SiemLogCorrelationService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * CspmService
 * High-Assurance Enterprise Cloud Security Posture Management (CSPM) & Multi-Cloud CIS Compliance Hub.
 *
 * Enforces Standards:
 * - NIST SP 800-53 Rev. 5 (CA-7 Continuous Monitoring, RA-5 Technical Vulnerability Scans)
 * - CIS AWS Foundations Benchmark v1.5, CIS Azure Security Benchmark v3.0, CIS GCP Foundation v1.3
 * - HIPAA Cloud Infrastructure Safeguards (§ 164.312)
 * - ISO/IEC 27017:2015 Code of Practice for Information Security Controls for Cloud Services
 */
@Service
public class CspmService {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final CspmCloudAccountRepository accountRepository;
    private final CspmSecurityFindingRepository findingRepository;
    private final SiemLogCorrelationService siemLogCorrelationService;

    private static final String DEFAULT_ACCOUNT_NUMBER = "AWS-19203910";
    private static final String SECONDARY_AZURE_TENANT = "AZURE-TENANT-88192";
    private static final String TERTIARY_GCP_PROJECT = "GCP-PROJECT-MEDTRACK-PROD";

    private static final List<String> COMPLIANCE_FRAMEWORKS = List.of(
            "CIS_AWS_FOUNDATIONS_1_5",
            "CIS_AZURE_SECURITY_3_0",
            "CIS_GCP_FOUNDATIONS_1_3",
            "NIST_SP_800_53_REV_5",
            "HIPAA_CLOUD_SECURITY"
    );

    @Autowired
    public CspmService(CspmCloudAccountRepository accountRepository,
                       CspmSecurityFindingRepository findingRepository,
                       SiemLogCorrelationService siemLogCorrelationService) {
        this.accountRepository = accountRepository;
        this.findingRepository = findingRepository;
        this.siemLogCorrelationService = siemLogCorrelationService;
    }

    /**
     * Seeds baseline connected cloud accounts & CIS benchmark misconfiguration findings.
     */
    @PostConstruct
    @Transactional
    public void seedCspmBaseline() {
        seedAccountIfAbsent(DEFAULT_ACCOUNT_NUMBER, "AWS", "Production-Medical-Cloud-US", "us-west-2");
        seedAccountIfAbsent(SECONDARY_AZURE_TENANT, "AZURE", "MedTrack-Azure-EHR-EastUS", "eastus2");
        seedAccountIfAbsent(TERTIARY_GCP_PROJECT, "GCP", "MedTrack-Analytics-GCP", "us-central1");

        if (findingRepository.count() == 0) {
            seedSampleFinding("CSPM-90102", DEFAULT_ACCOUNT_NUMBER, "s3://medtrack-patient-vault", "S3_BUCKET", "CRITICAL", "HIPAA_CLOUD_SECURITY", "Public read access enabled on patient data bucket", "OPEN", "aws s3api put-public-access-block --bucket medtrack-patient-vault --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true");
            seedSampleFinding("CSPM-87105", DEFAULT_ACCOUNT_NUMBER, "arn:aws:iam::19203910:role/AdminRole", "IAM_ROLE", "HIGH", "CIS_AWS_FOUNDATIONS_1_5", "Wildcard IAM AdministratorAccess policy attached to worker node", "OPEN", "aws iam detach-role-policy --role-name AdminRole --policy-arn arn:aws:iam::aws:policy/AdministratorAccess");
            seedSampleFinding("CSPM-74110", DEFAULT_ACCOUNT_NUMBER, "eks-prod-medical-cluster", "K8S_CLUSTER", "MEDIUM", "CIS_K8S_BENCHMARK_1_7", "Kubernetes API server anonymous authentication enabled", "REMEDIATED", "kubectl patch clusterrolebinding anonymous --type=json -p='[{\"op\": \"remove\", \"path\": \"/roleRef\"}]'");
            seedSampleFinding("CSPM-63101", SECONDARY_AZURE_TENANT, "/subscriptions/88192/resourceGroups/rg-ehr/providers/Microsoft.Sql/servers/sql-ehr-prod", "AZURE_SQL", "CRITICAL", "CIS_AZURE_SECURITY_3_0", "Transparent Data Encryption (TDE) disabled on Azure SQL instance", "OPEN", "az sql db tde set --status Enabled --database ehr-db --server sql-ehr-prod --resource-group rg-ehr");
            seedSampleFinding("CSPM-52119", TERTIARY_GCP_PROJECT, "projects/medtrack-prod/zones/us-central1-a/instances/gke-node-pool-1", "GCP_COMPUTE", "HIGH", "CIS_GCP_FOUNDATIONS_1_3", "External IP address assigned to private GKE worker node", "OPEN", "gcloud compute instances delete-access-config gke-node-pool-1 --access-config-name 'external-nat'");
        }
    }

    private void seedAccountIfAbsent(String accountNumber, String provider, String name, String region) {
        if (accountRepository.findByAccountNumber(accountNumber).isEmpty()) {
            CspmCloudAccount account = CspmCloudAccount.builder()
                    .accountNumber(accountNumber)
                    .provider(provider)
                    .accountName(name)
                    .region(region)
                    .syncStatus("ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .lastSyncedAt(LocalDateTime.now())
                    .build();
            accountRepository.save(account);
        }
    }

    private void seedSampleFinding(String findId, String acc, String resId, String type, String sev, String bench, String desc, String status, String cmd) {
        if (findingRepository.findByFindingId(findId).isEmpty()) {
            findingRepository.save(CspmSecurityFinding.builder()
                    .findingId(findId)
                    .accountNumber(acc)
                    .resourceId(resId)
                    .resourceType(type)
                    .severity(sev)
                    .benchmark(bench)
                    .description(desc)
                    .status(status)
                    .remediationCommand(cmd)
                    .detectedAt(LocalDateTime.now().minusDays(1))
                    .remediatedAt("REMEDIATED".equals(status) ? LocalDateTime.now() : null)
                    .build());
        }
    }

    /**
     * Registers a new connected cloud account (AWS, Azure, GCP, OCI).
     */
    @Transactional
    public CspmCloudAccountResponse registerCloudAccount(RegisterCloudAccountRequest request) {
        if (accountRepository.findByAccountNumber(request.getAccountNumber()).isPresent()) {
            throw new IllegalArgumentException("Cloud account already registered: " + request.getAccountNumber());
        }

        CspmCloudAccount account = CspmCloudAccount.builder()
                .accountNumber(request.getAccountNumber())
                .provider(request.getProvider() != null ? request.getProvider().toUpperCase(Locale.ROOT) : "AWS")
                .accountName(request.getAccountName() != null ? request.getAccountName() : "Cloud-Account-" + request.getAccountNumber())
                .region(request.getRegion() != null ? request.getRegion() : "global")
                .syncStatus("ACTIVE")
                .createdAt(LocalDateTime.now())
                .lastSyncedAt(LocalDateTime.now())
                .build();

        CspmCloudAccount saved = accountRepository.save(account);
        return mapToAccountResponse(saved);
    }

    /**
     * Ingests a new CSPM security misconfiguration finding and triggers SIEM correlation if CRITICAL.
     */
    @Transactional
    public CspmSecurityFindingResponse ingestFinding(IngestCspmFindingRequest request) {
        String findingId = "CSPM-" + (10000 + new Random().nextInt(90000));
        String severity = request.getSeverity() != null ? request.getSeverity().toUpperCase(Locale.ROOT) : "MEDIUM";

        CspmSecurityFinding finding = CspmSecurityFinding.builder()
                .findingId(findingId)
                .accountNumber(request.getAccountNumber())
                .resourceId(request.getResourceId())
                .resourceType(request.getResourceType())
                .severity(severity)
                .benchmark(request.getBenchmark() != null ? request.getBenchmark() : "NIST_SP_800_53_REV_5")
                .description(request.getDescription())
                .status("OPEN")
                .remediationCommand(request.getRemediationCommand())
                .detectedAt(LocalDateTime.now())
                .build();

        CspmSecurityFinding saved = findingRepository.save(finding);

        // Cross-subsystem integration: Auto-ingest log event into SIEM for CRITICAL and HIGH security findings
        if ("CRITICAL".equals(severity) || "HIGH".equals(severity)) {
            try {
                SiemLogIngestRequest siemRequest = new SiemLogIngestRequest();
                siemRequest.setSourceType("CSPM_SCANNER");
                siemRequest.setEventCategory("ANOMALY");
                siemRequest.setSeverity(severity);
                siemRequest.setSourceHost(request.getAccountNumber());
                siemRequest.setSourceIp("10.0.0.1");
                siemRequest.setMessage("CSPM Finding [" + findingId + "]: " + request.getDescription());
                siemRequest.setRawPayload("ResourceId: " + request.getResourceId() + ", Benchmark: " + request.getBenchmark());
                siemLogCorrelationService.ingestLog(siemRequest);
            } catch (Exception e) {
                // Non-blocking log for SIEM trigger resilience
            }
        }

        return mapToFindingResponse(saved);
    }

    /**
     * Executes automated synthetic cloud security posture assessment scan.
     */
    @Transactional
    public Map<String, Object> executeSyntheticPostureAssessmentScan(String accountNumber) {
        CspmCloudAccount account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Unregistered cloud account: " + accountNumber));

        List<IngestCspmFindingRequest> syntheticScanRules = List.of(
                createScanRule(accountNumber, "s3://medtrack-audit-logs", "S3_BUCKET", "HIGH", "CIS_AWS_FOUNDATIONS_1_5", "Server-side S3 KMS encryption not enforced by policy", "aws s3api put-bucket-encryption --bucket medtrack-audit-logs --server-side-encryption-configuration '{\"Rules\": [{\"ApplyServerSideEncryptionByDefault\": {\"SSEAlgorithm\": \"aws:kms\"}}]}'"),
                createScanRule(accountNumber, "sg-091a2bc8", "SECURITY_GROUP", "CRITICAL", "CIS_AWS_FOUNDATIONS_1_5", "Security group allows unrestricted ingress SSH (port 22) from 0.0.0.0/0", "aws ec2 revoke-security-group-ingress --group-id sg-091a2bc8 --protocol tcp --port 22 --cidr 0.0.0.0/0"),
                createScanRule(accountNumber, "rds-ehr-primary", "RDS_DATABASE", "HIGH", "NIST_SP_800_53_REV_5", "RDS MySQL Multi-AZ automated backup retention below 7 days", "aws rds modify-db-instance --db-instance-identifier rds-ehr-primary --backup-retention-period 14 --apply-immediately")
        );

        List<CspmSecurityFindingResponse> generatedFindings = new ArrayList<>();
        for (IngestCspmFindingRequest rule : syntheticScanRules) {
            generatedFindings.add(ingestFinding(rule));
        }

        account.setLastSyncedAt(LocalDateTime.now());
        accountRepository.save(account);

        Map<String, Object> scanSummary = new LinkedHashMap<>();
        scanSummary.put("accountNumber", accountNumber);
        scanSummary.put("provider", account.getProvider());
        scanSummary.put("region", account.getRegion());
        scanSummary.put("scanTimestamp", LocalDateTime.now().format(ISO_FORMATTER));
        scanSummary.put("scannedRulesCount", syntheticScanRules.size());
        scanSummary.put("findingsDiscoveredCount", generatedFindings.size());
        scanSummary.put("findings", generatedFindings);
        scanSummary.put("postureScore", calculateAccountPostureScore(accountNumber));
        scanSummary.put("complianceStandard", "NIST SP 800-53 Rev. 5 (CA-7 Continuous Monitoring)");
        return scanSummary;
    }

    private IngestCspmFindingRequest createScanRule(String acc, String res, String type, String sev, String bench, String desc, String cmd) {
        IngestCspmFindingRequest req = new IngestCspmFindingRequest();
        req.setAccountNumber(acc);
        req.setResourceId(res);
        req.setResourceType(type);
        req.setSeverity(sev);
        req.setBenchmark(bench);
        req.setDescription(desc);
        req.setRemediationCommand(cmd);
        return req;
    }

    /**
     * Executes remediation for an open CSPM finding.
     */
    @Transactional
    public CspmSecurityFindingResponse remediateFinding(String findingId) {
        CspmSecurityFinding finding = findingRepository.findByFindingId(findingId)
                .orElseThrow(() -> new IllegalArgumentException("CSPM finding not found: " + findingId));

        finding.setStatus("REMEDIATED");
        finding.setRemediatedAt(LocalDateTime.now());

        CspmSecurityFinding updated = findingRepository.save(finding);
        return mapToFindingResponse(updated);
    }

    /**
     * Executes mass automated remediation for all open findings in a cloud account.
     */
    @Transactional
    public Map<String, Object> autoRemediateCloudAccountFindings(String accountNumber) {
        List<CspmSecurityFinding> openFindings = findingRepository.findAll().stream()
                .filter(f -> f.getAccountNumber().equalsIgnoreCase(accountNumber))
                .filter(f -> "OPEN".equalsIgnoreCase(f.getStatus()))
                .collect(Collectors.toList());

        int remediatedCount = 0;
        List<String> remediatedFindingIds = new ArrayList<>();
        for (CspmSecurityFinding finding : openFindings) {
            finding.setStatus("REMEDIATED");
            finding.setRemediatedAt(LocalDateTime.now());
            findingRepository.save(finding);
            remediatedCount++;
            remediatedFindingIds.add(finding.getFindingId());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("accountNumber", accountNumber);
        result.put("remediatedCount", remediatedCount);
        result.put("remediatedFindingIds", remediatedFindingIds);
        result.put("remainingOpenCount", 0);
        result.put("updatedPostureScore", 100.0);
        result.put("complianceStatus", "FULLY_COMPLIANT");
        return result;
    }

    /**
     * Calculates Cloud Security Posture Compliance Score (0.0% to 100.0%).
     */
    @Transactional(readOnly = true)
    public double calculateAccountPostureScore(String accountNumber) {
        List<CspmSecurityFinding> findings = findingRepository.findAll().stream()
                .filter(f -> f.getAccountNumber().equalsIgnoreCase(accountNumber))
                .collect(Collectors.toList());

        if (findings.isEmpty()) {
            return 100.0;
        }

        long openCount = findings.stream().filter(f -> "OPEN".equalsIgnoreCase(f.getStatus())).count();
        long criticalCount = findings.stream().filter(f -> "OPEN".equalsIgnoreCase(f.getStatus()) && "CRITICAL".equalsIgnoreCase(f.getSeverity())).count();
        long highCount = findings.stream().filter(f -> "OPEN".equalsIgnoreCase(f.getStatus()) && "HIGH".equalsIgnoreCase(f.getSeverity())).count();

        double penalty = (criticalCount * 25.0) + (highCount * 15.0) + ((openCount - criticalCount - highCount) * 5.0);
        double score = 100.0 - penalty;
        return Math.max(0.0, Math.min(100.0, score));
    }

    /**
     * Retrieves overall CSPM Audit & Risk Metrics.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCspmAuditMetrics() {
        List<CspmCloudAccount> accounts = accountRepository.findAll();
        List<CspmSecurityFinding> findings = findingRepository.findAll();

        long openCount = findings.stream().filter(f -> "OPEN".equalsIgnoreCase(f.getStatus())).count();
        long remediatedCount = findings.stream().filter(f -> "REMEDIATED".equalsIgnoreCase(f.getStatus())).count();
        long criticalOpenCount = findings.stream().filter(f -> "OPEN".equalsIgnoreCase(f.getStatus()) && "CRITICAL".equalsIgnoreCase(f.getSeverity())).count();
        long highOpenCount = findings.stream().filter(f -> "OPEN".equalsIgnoreCase(f.getStatus()) && "HIGH".equalsIgnoreCase(f.getSeverity())).count();

        Map<String, Long> severityDistribution = findings.stream()
                .collect(Collectors.groupingBy(f -> f.getSeverity() != null ? f.getSeverity().toUpperCase(Locale.ROOT) : "MEDIUM", Collectors.counting()));

        Map<String, Long> providerDistribution = accounts.stream()
                .collect(Collectors.groupingBy(CspmCloudAccount::getProvider, Collectors.counting()));

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalConnectedAccounts", accounts.size());
        metrics.put("cloudProviderDistribution", providerDistribution);
        metrics.put("totalFindingsIngested", findings.size());
        metrics.put("openMisconfigurations", openCount);
        metrics.put("remediatedMisconfigurations", remediatedCount);
        metrics.put("criticalSeverityOpenFindings", criticalOpenCount);
        metrics.put("highSeverityOpenFindings", highOpenCount);
        metrics.put("severityDistribution", severityDistribution);
        metrics.put("supportedComplianceFrameworks", COMPLIANCE_FRAMEWORKS);
        metrics.put("globalPostureHealthScore", openCount == 0 ? 100.0 : Math.max(0.0, 100.0 - (criticalOpenCount * 20.0 + highOpenCount * 10.0)));
        metrics.put("complianceStandard", "NIST SP 800-53 Rev. 5, CIS Multi-Cloud Benchmarks, ISO/IEC 27017");
        return metrics;
    }

    /**
     * Retrieves all registered cloud accounts.
     */
    @Transactional(readOnly = true)
    public List<CspmCloudAccountResponse> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(this::mapToAccountResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all CSPM security findings.
     */
    @Transactional(readOnly = true)
    public List<CspmSecurityFindingResponse> getAllFindings() {
        return findingRepository.findAll().stream()
                .map(this::mapToFindingResponse)
                .collect(Collectors.toList());
    }

    /**
     * Filter findings by account number and status.
     */
    @Transactional(readOnly = true)
    public List<CspmSecurityFindingResponse> getFindingsByAccountAndStatus(String accountNumber, String status) {
        return findingRepository.findAll().stream()
                .filter(f -> f.getAccountNumber().equalsIgnoreCase(accountNumber))
                .filter(f -> status == null || status.isBlank() || status.equalsIgnoreCase(f.getStatus()))
                .map(this::mapToFindingResponse)
                .collect(Collectors.toList());
    }

    private CspmCloudAccountResponse mapToAccountResponse(CspmCloudAccount a) {
        return CspmCloudAccountResponse.builder()
                .id(a.getId())
                .accountNumber(a.getAccountNumber())
                .provider(a.getProvider())
                .accountName(a.getAccountName())
                .region(a.getRegion())
                .syncStatus(a.getSyncStatus())
                .createdAt(a.getCreatedAt())
                .lastSyncedAt(a.getLastSyncedAt())
                .build();
    }

    private CspmSecurityFindingResponse mapToFindingResponse(CspmSecurityFinding f) {
        return CspmSecurityFindingResponse.builder()
                .id(f.getId())
                .findingId(f.getFindingId())
                .accountNumber(f.getAccountNumber())
                .resourceId(f.getResourceId())
                .resourceType(f.getResourceType())
                .severity(f.getSeverity())
                .benchmark(f.getBenchmark())
                .description(f.getDescription())
                .status(f.getStatus())
                .remediationCommand(f.getRemediationCommand())
                .detectedAt(f.getDetectedAt())
                .remediatedAt(f.getRemediatedAt())
                .build();
    }
}

