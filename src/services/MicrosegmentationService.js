import API from "./HttpService";

// Get all microsegmentation isolation rules
export const getAllPolicies = async () => {
  const response = await API.get("/api/auth/microsegmentation/rules");
  return response.data;
};

// Create a new microsegmentation rule
export const createRule = async (data) => {
  const response = await API.post("/api/auth/microsegmentation/rules", data);
  return response.data;
};

// Toggle microsegmentation rule active status
export const toggleRuleStatus = async (ruleId, active) => {
  const response = await API.put(`/api/auth/microsegmentation/rules/${ruleId}/toggle`, null, {
    params: { active }
  });
  return response.data;
};

// Get all SDP tunnel sessions
export const getAllTunnels = async () => {
  const response = await API.get("/api/auth/microsegmentation/tunnels");
  return response.data;
};

// Establish a Software-Defined Perimeter (SDP) tunnel
export const establishTunnel = async (data) => {
  const response = await API.post("/api/auth/microsegmentation/tunnels/establish", data);
  return response.data;
};

// Terminate an active SDP tunnel
export const terminateTunnel = async (sessionId) => {
  const response = await API.put(`/api/auth/microsegmentation/tunnels/${sessionId}/terminate`);
  return response.data;
};

// Real-time Zero-Trust traffic access evaluation
export const evaluateTrafficAccess = async (data) => {
  const response = await API.post("/api/auth/microsegmentation/evaluate", data);
  return response.data;
};

// Emergency source segment quarantine
export const quarantineSourceSegment = async (data) => {
  const response = await API.post("/api/auth/microsegmentation/quarantine", data);
  return response.data;
};

// Get Zero-Trust policy violation audit logs
export const getViolationLogs = async () => {
  const response = await API.get("/api/auth/microsegmentation/violations");
  return response.data;
};

// Get Linux kernel eBPF bytecode compilation matrix simulation
export const getEbpfMatrix = async () => {
  const response = await API.get("/api/auth/microsegmentation/ebpf/matrix");
  return response.data;
};

// Get Zero-Trust microsegmentation & SDP audit metrics
export const getAuditMetrics = async () => {
  const response = await API.get("/api/auth/microsegmentation/metrics");
  return response.data;
};
