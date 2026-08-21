package com.medtrack.dto;

import com.medtrack.model.MaintenanceWorkOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceWorkOrderDashboardResponse {

    private long total;

    private long open;

    private long assigned;

    private long inProgress;

    private long onHold;

    private long completed;

    private long cancelled;

    private long overdue;

    private List<MaintenanceWorkOrderResponse> recentWorkOrders;
}