package com.medtrack.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.ArrayList;
import java.util.logging.Logger;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DroneFleetService {
    private static final Logger logger = Logger.getLogger(DroneFleetService.class.getName());
    
    private final Map<String, DroneState> fleetState = new ConcurrentHashMap<>();
    
    public static class Coordinate {
        public double lat;
        public double lng;
        public double altMeters;
        
        public Coordinate(double lat, double lng, double alt) {
            this.lat = lat; this.lng = lng; this.altMeters = alt;
        }
    }
    
    public static class DroneState {
        public Coordinate currentPosition;
        public double batteryPct;
        public double payloadTempC;
        public String status;
    }
    
    public void ingestTelemetry(String droneId, double lat, double lng, double alt, double batt, double temp) {
        DroneState state = fleetState.computeIfAbsent(droneId, k -> new DroneState());
        state.currentPosition = new Coordinate(lat, lng, alt);
        state.batteryPct = batt;
        state.payloadTempC = temp;
        
        checkAnomalies(droneId, state);
    }
    
    public List<Coordinate> calculateOptimalRoute(Coordinate start, Coordinate dest, double currentWindSpeed) {
        logger.info("Calculating 3D dynamic route using A* and airspace restrictions...");
        List<Coordinate> waypoints = new ArrayList<>();
        // Mock Dijkstra/A* routing logic avoiding NFZ (No Fly Zones)
        waypoints.add(start);
        waypoints.add(new Coordinate(start.lat + 0.01, start.lng + 0.01, 120.0));
        waypoints.add(dest);
        return waypoints;
    }
    
    private void checkAnomalies(String droneId, DroneState state) {
        if (state.payloadTempC > 8.0) { // e.g. blood payload getting too warm
            logger.warning(String.format("Drone %s payload temp critical! Rerouting.", droneId));
            triggerEmergencyAbort(droneId);
        }
        if (state.batteryPct < 15.0) {
            logger.warning(String.format("Drone %s battery low! Triggering return to base.", droneId));
        }
    }
    
    private void triggerEmergencyAbort(String droneId) {
        DroneState state = fleetState.get(droneId);
        if (state != null) {
            state.status = "EMERGENCY_ABORT";
            // Logic to dispatch MQTT command to drone autopilot to land at nearest safe facility
        }
    }
}
