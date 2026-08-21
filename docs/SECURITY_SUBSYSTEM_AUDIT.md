# MedTrack Security Hub — Subsystem Issue & PR Audit

Cross-subsystem security engineering audit log for the MedTrack Security Hub.
Each row records the completed subsystem, its feature branch, and its linked
GitHub issue and pull request on `kRamu81/MedTrack_Application`.

| Subsystem Name | Branch | Issue | PR |
| :--- | :--- | :--- | :--- |
| **HSM FIPS Attestation** | `feature/biomedical-hsm-fips-attestation-subsystem` | [#902](https://github.com/kRamu81/MedTrack_Application/issues/902) | [#903](https://github.com/kRamu81/MedTrack_Application/pull/903) |
| **CTI STIX/TAXII Sharing** | `feature/biomedical-cti-stix-taxii-sharing-subsystem` | [#904](https://github.com/kRamu81/MedTrack_Application/issues/904) | [#905](https://github.com/kRamu81/MedTrack_Application/pull/905) |
| **CTEM Attack Surface** | `feature/biomedical-ctem-attack-surface-subsystem` | [#906](https://github.com/kRamu81/MedTrack_Application/issues/906) | [#907](https://github.com/kRamu81/MedTrack_Application/pull/907) |
| **ZKP Verifiable EHR** | `feature/biomedical-zkp-verifiable-ehr-subsystem` | [#900](https://github.com/kRamu81/MedTrack_Application/issues/900) | [#901](https://github.com/kRamu81/MedTrack_Application/pull/901) |
| **AI Agent Governance** | `feature/biomedical-ai-agent-governance-subsystem` | [#898](https://github.com/kRamu81/MedTrack_Application/issues/898) | [#899](https://github.com/kRamu81/MedTrack_Application/pull/899) |
| **Blockchain Audit Ledger** | `feature/biomedical-blockchain-audit-ledger-subsystem` | [#921](https://github.com/kRamu81/MedTrack_Application/issues/921) | [#922](https://github.com/kRamu81/MedTrack_Application/pull/922) |
| **BAS Penetration Testing** | `feature/biomedical-bas-penetration-testing-subsystem` | [#923](https://github.com/kRamu81/MedTrack_Application/issues/923) | [#924](https://github.com/kRamu81/MedTrack_Application/pull/924) |
| **Confidential Compute Enclave** | `feature/biomedical-confidential-compute-enclave-subsystem` | [#925](https://github.com/kRamu81/MedTrack_Application/issues/925) | [#926](https://github.com/kRamu81/MedTrack_Application/pull/926) |
| **FHE MPC Telemetry** | `feature/biomedical-fhe-mpc-telemetry-subsystem` | [#927](https://github.com/kRamu81/MedTrack_Application/issues/927) | [#928](https://github.com/kRamu81/MedTrack_Application/pull/928) |
| **AI Watermark C2PA Provenance** | `feature/biomedical-ai-watermark-c2pa-provenance-subsystem` | [#929](https://github.com/kRamu81/MedTrack_Application/issues/929) | [#930](https://github.com/kRamu81/MedTrack_Application/pull/930) |
| **QKD Post-Quantum VPN** | `feature/biomedical-qkd-post-quantum-vpn-subsystem` | [#960](https://github.com/kRamu81/MedTrack_Application/issues/960) | [#961](https://github.com/kRamu81/MedTrack_Application/pull/961) |
| **Zero-Trust eBPF Perimeter** | `feature/biomedical-zerotrust-ebpf-perimeter-subsystem` | [#962](https://github.com/kRamu81/MedTrack_Application/issues/962) | [#963](https://github.com/kRamu81/MedTrack_Application/pull/963) |
| **OAuth 2.1 Backend Security** | `feature/api-gateway-oauth21-token-security-subsystem` | [#964](https://github.com/kRamu81/MedTrack_Application/issues/964) | [#965](https://github.com/kRamu81/MedTrack_Application/pull/965) |
| **FIDO2 WebAuthn Backend** | `feature/fido2-webauthn-biometric-auth-subsystem` | [#966](https://github.com/kRamu81/MedTrack_Application/issues/966) | [#967](https://github.com/kRamu81/MedTrack_Application/pull/967) |
| **SAML 2.0 Identity Federation** | `feature/saml2-identity-federation-sso-subsystem` | [#968](https://github.com/kRamu81/MedTrack_Application/issues/968) | [#969](https://github.com/kRamu81/MedTrack_Application/pull/969) |
| **SCIM 2.0 User Provisioning** | `feature/scim-user-provisioning-subsystem` | [#1005](https://github.com/kRamu81/MedTrack_Application/issues/1005) | [#1006](https://github.com/kRamu81/MedTrack_Application/pull/1006) |
| **JWT Auth & Key Rotation** | `feature/jwt-auth-security` | [#1007](https://github.com/kRamu81/MedTrack_Application/issues/1007) | [#1008](https://github.com/kRamu81/MedTrack_Application/pull/1008) |
| **PAM JIT Credential Elevation** | `feature/pam-jit-credential-elevation-subsystem` | [#1009](https://github.com/kRamu81/MedTrack_Application/issues/1009) | [#1010](https://github.com/kRamu81/MedTrack_Application/pull/1010) |
| **SOAR Incident Response** | `feature/soar-incident-response-orchestration-subsystem` | [#1011](https://github.com/kRamu81/MedTrack_Application/issues/1011) | [#1012](https://github.com/kRamu81/MedTrack_Application/pull/1012) |
| **Cross-Subsystem Integration** | `feature/cross-subsystem-security-orchestration` | [#1013](https://github.com/kRamu81/MedTrack_Application/issues/1013) | [#1014](https://github.com/kRamu81/MedTrack_Application/pull/1014) |
| **SIEM Log Correlation Hub** | `feature/siem-log-correlation-hub-subsystem` | issue pending (token lacks write access) | [upstream comparison](https://github.com/kRamu81/MedTrack_Application/compare/main...dipanshubatra:feature/siem-log-correlation-hub-subsystem?expand=1) |

## Notes

- The SIEM Log Correlation Hub row was added on 2026-08-12. Programmatic
  issue/PR creation against `kRamu81/MedTrack_Application` is blocked because
  the fine-grained personal access token authenticating `gh` has read-only
  Issues / Pull requests permissions (verified: `createIssue`,
  `createPullRequest`, and REST issue creation all return HTTP 403 on both
  `kRamu81` and the `dipanshubatra` fork). Once the token is granted
  `Issues: Read and write` and `Pull requests: Read and write` for
  `kRamu81/MedTrack_Application`, the issue and PR can be created
  programmatically and this row updated.
- Fallback contribution path (works without API write access):
  open the upstream comparison link above, or run
  `gh pr create --repo kRamu81/MedTrack_Application --head dipanshubatra:feature/siem-log-correlation-hub-subsystem --base main`.
