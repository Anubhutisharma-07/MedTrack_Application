package com.medtrack.auth.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "app.data-initializer.enabled=true"
})
@AutoConfigureMockMvc
public class AiAssistantRateLimitingTest {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private com.medtrack.auth.repository.UserRepository userRepository;

    private Long techUserId;
    private Long adminUserId;

    @BeforeEach
    public void setup() {
        techUserId = userRepository.findByEmail("tech@medtrack.com")
                .map(com.medtrack.auth.model.User::getId)
                .orElse(2L);
        adminUserId = userRepository.findByEmail("hospital@medtrack.com")
                .map(com.medtrack.auth.model.User::getId)
                .orElse(1L);
    }

    @Test
    public void testTechnicianRateLimit() throws Exception {
        String techToken = jwtUtil.generateToken(techUserId, "tech@medtrack.com", "TECHNICIAN");

        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/ai-assistant/chat")
                    .header("Authorization", "Bearer " + techToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"prompt\":\"hello\"}"))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(post("/api/ai-assistant/chat")
                .header("Authorization", "Bearer " + techToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"prompt\":\"hello\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.detail").value("AI Assistant request rate limit exceeded. Please try again later."));
    }

    @Test
    public void testAdminRateLimit() throws Exception {
        String adminToken = jwtUtil.generateToken(adminUserId, "hospital@medtrack.com", "HOSPITAL");

        for (int i = 0; i < 50; i++) {
            mockMvc.perform(post("/api/ai-assistant/chat")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"prompt\":\"hello\"}"))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(post("/api/ai-assistant/chat")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"prompt\":\"hello\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.detail").value("AI Assistant request rate limit exceeded. Please try again later."));
    }

    @Test
    public void testIsolationBetweenUsers() throws Exception {
        // Create a new user in DB to ensure JWT validation passes
        com.medtrack.auth.model.User newTech = new com.medtrack.auth.model.User();
        newTech.setEmail("tech2@medtrack.com");
        newTech.setPassword("password");
        newTech.setRole("TECHNICIAN");
        newTech.setUsername("tech2");
        newTech.setName("Tech Two");
        newTech.setAuthorityVersion(1L);
        newTech.setPhone("1234567890");
        newTech.setOrganization("MedTrack");
        newTech = userRepository.save(newTech);

        // A new user should have their own fresh bucket of 10 requests.
        String newTechToken = jwtUtil.generateToken(newTech.getId(), newTech.getEmail(), newTech.getRole());

        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/ai-assistant/chat")
                    .header("Authorization", "Bearer " + newTechToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"prompt\":\"hello\"}"))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(post("/api/ai-assistant/chat")
                .header("Authorization", "Bearer " + newTechToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"prompt\":\"hello\"}"))
                .andExpect(status().isTooManyRequests());
    }
}
