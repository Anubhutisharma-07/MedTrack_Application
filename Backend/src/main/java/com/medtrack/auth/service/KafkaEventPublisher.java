package com.medtrack.auth.service;

import com.medtrack.auth.event.UserLoginEvent;
import com.medtrack.auth.event.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KafkaEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventPublisher.class);

    /**
     * Optional on purpose: authentication must keep working when no broker is configured, which is
     * the case in tests and in any deployment that has not enabled Kafka. As a required constructor
     * dependency this bean could not be created and the application context failed to start.
     */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.user-events:user-events}")
    private String userEventsTopic;

    public void publishUserRegistered(UserRegisteredEvent event) {
        if (kafkaTemplate == null) {
            log.debug("Kafka is not configured; skipping UserRegisteredEvent for user: [{}]", event.getUsername());
            return;
        }
        try {
            log.info("Publishing UserRegisteredEvent for user: [{}]", event.getUsername());
            kafkaTemplate.send(userEventsTopic, String.valueOf(event.getUserId()), event);
        } catch (Exception e) {
            log.error("Failed to publish UserRegisteredEvent for user: [{}] due to error: {}", 
                    event.getUsername(), e.getMessage(), e);
        }
    }

    public void publishUserLogin(UserLoginEvent event) {
        if (kafkaTemplate == null) {
            log.debug("Kafka is not configured; skipping UserLoginEvent for user: [{}]", event.getUsername());
            return;
        }
        try {
            log.info("Publishing UserLoginEvent for user: [{}]", event.getUsername());
            kafkaTemplate.send(userEventsTopic, String.valueOf(event.getUserId()), event);
        } catch (Exception e) {
            log.error("Failed to publish UserLoginEvent for user: [{}] due to error: {}", 
                    event.getUsername(), e.getMessage(), e);
        }
    }
}
