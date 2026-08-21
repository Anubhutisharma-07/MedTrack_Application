package com.medtrack.service;

import org.springframework.stereotype.Service;
import java.util.logging.Logger;
import java.util.List;
import java.util.ArrayList;
import java.util.Random;

@Service
public class FederatedLearningService {
    private static final Logger logger = Logger.getLogger(FederatedLearningService.class.getName());
    
    private final List<double[]> currentEpochWeights = new ArrayList<>();
    private int currentEpoch = 0;
    private final Random random = new Random();
    
    public synchronized void submitNodeWeights(String nodeId, int epoch, double[] weights) {
        if (epoch != currentEpoch) {
            logger.warning("Rejecting weights for stale epoch from node: " + nodeId);
            return;
        }
        
        logger.info(String.format("Received model weights from node %s for epoch %d", nodeId, epoch));
        
        // Apply differential privacy Laplace noise before aggregation
        double[] noisyWeights = applyLaplaceNoise(weights, 0.01);
        currentEpochWeights.add(noisyWeights);
        
        if (currentEpochWeights.size() >= getRequiredNodeCount()) {
            aggregateGlobalModel();
        }
    }
    
    private void aggregateGlobalModel() {
        logger.info("Threshold reached. Aggregating global model using FedAvg...");
        int numWeights = currentEpochWeights.get(0).length;
        double[] globalWeights = new double[numWeights];
        
        for (double[] nodeWeights : currentEpochWeights) {
            for (int i = 0; i < numWeights; i++) {
                globalWeights[i] += nodeWeights[i];
            }
        }
        
        for (int i = 0; i < numWeights; i++) {
            globalWeights[i] /= currentEpochWeights.size();
        }
        
        // Save global weights and broadcast to nodes
        saveGlobalModel(globalWeights);
        
        currentEpochWeights.clear();
        currentEpoch++;
    }
    
    private double[] applyLaplaceNoise(double[] weights, double epsilon) {
        double[] noisy = new double[weights.length];
        double scale = 1.0 / epsilon;
        for (int i = 0; i < weights.length; i++) {
            double u = random.nextDouble() - 0.5;
            double noise = -scale * Math.signum(u) * Math.log(1 - 2 * Math.abs(u));
            noisy[i] = weights[i] + noise;
        }
        return noisy;
    }
    
    private void saveGlobalModel(double[] weights) {
        logger.info("Successfully updated global disease outbreak detection model.");
        // Logic to persist to model registry
    }
    
    private int getRequiredNodeCount() {
        return 10; // e.g., require 10 hospital nodes to complete an epoch
    }
}
