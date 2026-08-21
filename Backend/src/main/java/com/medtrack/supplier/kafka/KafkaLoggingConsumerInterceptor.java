package com.medtrack.supplier.kafka;

import org.apache.kafka.clients.consumer.ConsumerInterceptor;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.header.Header;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import java.util.Map;

public class KafkaLoggingConsumerInterceptor implements ConsumerInterceptor<String, Object> {

    private static final Logger log = LoggerFactory.getLogger(KafkaLoggingConsumerInterceptor.class);
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String CORRELATION_ID_LOG_VAR = "correlationId";

    @Override
    public ConsumerRecords<String, Object> onConsume(ConsumerRecords<String, Object> records) {
        records.forEach(record -> {
            Header header = record.headers().lastHeader(CORRELATION_ID_HEADER);
            if (header != null) {
                MDC.put(CORRELATION_ID_LOG_VAR, new String(header.value()));
            }
            log.info("Consumed Kafka event from topic [{}] key [{}], payload: {}",
                    record.topic(), record.key(), record.value());
        });
        return records;
    }

    @Override
    public void onCommit(Map<TopicPartition, OffsetAndMetadata> offsets) {
        log.debug("Committed Kafka offsets: {}", offsets);
        MDC.remove(CORRELATION_ID_LOG_VAR); // Clean up MDC after commit if possible, though interceptor boundaries make
                                            // this tricky
    }

    @Override
    public void close() {
    }

    @Override
    public void configure(Map<String, ?> configs) {
    }
}
