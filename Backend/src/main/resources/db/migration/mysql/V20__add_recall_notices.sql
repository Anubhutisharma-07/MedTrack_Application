-- Medical equipment recall and safety notice foundation (issue #1054).
--
-- Stores manufacturer recall criteria and resolution information.
-- Equipment matching and affected-asset tracking will be added separately.

CREATE TABLE recall_notice (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    manufacturer VARCHAR(255) NOT NULL,
    model_number VARCHAR(255),
    serial_number VARCHAR(255),
    serial_number_start VARCHAR(255),
    serial_number_end VARCHAR(255),
    lot_number VARCHAR(255),
    recall_reference VARCHAR(255) NOT NULL,
    recall_date DATE NOT NULL,
    reason VARCHAR(2000) NOT NULL,
    severity VARCHAR(30) NOT NULL,
    manufacturer_instructions VARCHAR(4000),
    resolution_deadline DATE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);