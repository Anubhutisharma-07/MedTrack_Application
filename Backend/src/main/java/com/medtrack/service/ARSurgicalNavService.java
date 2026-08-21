package com.medtrack.service;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.TextMessage;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;
import java.io.IOException;

@Service
public class ARSurgicalNavService {
    private static final Logger logger = Logger.getLogger(ARSurgicalNavService.class.getName());
    
    // Maps surgery session IDs to connected AR headset WebSockets
    private final ConcurrentHashMap<String, WebSocketSession> activeARStreams = new ConcurrentHashMap<>();
    
    public void registerHeadset(String surgeryId, WebSocketSession session) {
        activeARStreams.put(surgeryId, session);
        logger.info("Registered new AR headset for surgery: " + surgeryId);
    }
    
    public void disconnectHeadset(String surgeryId) {
        activeARStreams.remove(surgeryId);
        logger.info("Disconnected AR headset for surgery: " + surgeryId);
    }
    
    public void streamVolumetricFrame(String surgeryId, byte[] dicomVoxelData) {
        WebSocketSession session = activeARStreams.get(surgeryId);
        if (session != null && session.isOpen()) {
            try {
                // Compress and stream voxel data
                byte[] compressed = compressVoxelData(dicomVoxelData);
                // session.sendMessage(new org.springframework.web.socket.BinaryMessage(compressed));
            } catch (Exception e) {
                logger.severe("Failed to stream volumetric frame: " + e.getMessage());
            }
        }
    }
    
    public void updateSpatialCalibration(String surgeryId, double[] transformationMatrix) {
        WebSocketSession session = activeARStreams.get(surgeryId);
        if (session != null && session.isOpen()) {
            try {
                String matrixJson = serializeMatrix(transformationMatrix);
                session.sendMessage(new TextMessage("CALIBRATE:" + matrixJson));
            } catch (IOException e) {
                logger.severe("Failed to send calibration data.");
            }
        }
    }
    
    private byte[] compressVoxelData(byte[] raw) {
        // Implement fast LZ4 or Zstd compression for WebRTC streaming
        return raw; 
    }
    
    private String serializeMatrix(double[] matrix) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < matrix.length; i++) {
            sb.append(matrix[i]);
            if (i < matrix.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }
}
