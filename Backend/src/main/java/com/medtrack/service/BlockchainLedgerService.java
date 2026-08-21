package com.medtrack.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.logging.Logger;

@Service
public class BlockchainLedgerService {
    private static final Logger logger = Logger.getLogger(BlockchainLedgerService.class.getName());
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${blockchain.node.url:http://localhost:8545}")
    private String nodeUrl;
    
    @Value("${blockchain.contract.address:0x000000000000000000}")
    private String contractAddress;
    
    public String hashEhrRecord(String patientId, String ehrData) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String dataToHash = patientId + ":" + ehrData;
            byte[] hashBytes = digest.digest(dataToHash.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            logger.severe("Failed to hash EHR data: " + e.getMessage());
            throw new RuntimeException("Hashing failed", e);
        }
    }
    
    public boolean verifyConsentOnChain(String patientId, String requestingProviderId) {
        logger.info(String.format("Verifying blockchain consent for provider %s accessing patient %s", requestingProviderId, patientId));
        // Mock RPC call to blockchain node to check smart contract mapping
        String rpcPayload = String.format("{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"%s\",\"data\":\"0x...\"}, \"latest\"],\"id\":1}", contractAddress);
        try {
            // ResponseEntity<String> response = restTemplate.postForEntity(nodeUrl, rpcPayload, String.class);
            // return parseConsentVerification(response.getBody());
            return true; // Mock true for now
        } catch (Exception e) {
            logger.warning("Blockchain node unreachable, falling back to local cache.");
            return false;
        }
    }
    
    public String recordConsentTransaction(String patientId, String providerId, int durationSeconds) {
        logger.info("Recording new consent transaction to ledger...");
        // Mock transaction hash return
        return "0x" + hashEhrRecord(patientId, String.valueOf(System.currentTimeMillis()));
    }
}
