package com.medtrack.supplier.kafka;

import org.apache.kafka.clients.producer.ProducerInterceptor;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import java.util.Map;
import java.util.UUID;

public class KafkaLoggingProducerInterceptor implements ProducerInterceptor<String, Object> {

    private static final Logger log = LoggerFactory.getLogger(KafkaLoggingProducerInterceptor.class);
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String CORRELATION_ID_LOG_VAR = "correlationId";

    @Override
    public ProducerRecord<String, Object> onSend(ProducerRecord<String, Object> record) {
        String correlationId = MDC.get(CORRELATION_ID_LOG_VAR);
        if (correlationId == null) {
            correlationId = UUID.randomUUID().toString();
        }

        // Add header if not present
        if (record.headers().lastHeader(CORRELATION_ID_HEADER) == null) {
            record.headers().add(CORRELATION_ID_HEADER, correlationId.getBytes());
        }

        log.info("Publishing Kafka event to topic [{}] with correlationId [{}], payload: {}",
                record.topic(), correlationId, record.value());

        return record;
    }

    @Override
    public void onAcknowledgement(RecordMetadata metadata, Exception exception) {
        if (exception != null) {
            log.error("Failed to publish Kafka event to topic [{}]: {}",
                    metadata != null ? metadata.topic() : "unknown", exception.getMessage(), exception);
        } else if (metadata != null) {
            log.debug("Successfully published Kafka event to topic [{}] partition [{}] offset [{}]",
                    metadata.topic(), metadata.partition(), metadata.offset());
        }
    }

    @Override
    public void close() {
        // No resources to close
    }

    @Override
    public void configure(Map<String, ?> configs) {
        // No specific configuration handled
    }
}
