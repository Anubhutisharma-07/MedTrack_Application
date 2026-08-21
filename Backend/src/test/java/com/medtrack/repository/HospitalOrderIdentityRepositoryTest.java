package com.medtrack.repository;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.auth.service.KafkaEventPublisher;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.model.Hospital;
import com.medtrack.supplier.repository.ShipmentTrackingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * {@code EquipmentOrder.hospital} is a free-text label written by two flows that disagree about
 * what belongs in it: {@code OrderService.placeOrder} writes {@code User.organization},
 * {@code ProcurementService.acceptQuote} wrote the {@code Hospital} profile name. Nothing ties those
 * two strings together, so an order was visible to whichever half of the application happened to
 * agree with whoever created it.
 *
 * <p>These tests run the identity-matching queries against a real database with both labels present,
 * because the matching is entirely in JPQL - a mocked repository would prove nothing about it. The
 * hospital here is deliberately set up the way the bug needs: profile name and user organisation
 * that differ.</p>
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration",
        "spring.datasource.url=jdbc:h2:mem:hospital-order-identity-tests;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.data-initializer.enabled=false"
})
@Transactional
class HospitalOrderIdentityRepositoryTest {

    private static final String PROFILE_NAME = "City General Hospital";
    private static final String ORGANIZATION = "City General";

    @MockitoBean
    private KafkaEventPublisher kafkaEventPublisher;

    // Carries an unrelated invalid DATEDIFF query that fails to bootstrap; mocked so this test can
    // exercise EquipmentOrderRepository, exactly as SupplierOrderQueryRepositoryTest does.
    @MockitoBean
    private ShipmentTrackingRepository shipmentRepository;

    @Autowired
    private EquipmentOrderRepository orderRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    private Hospital hospital;
    private String ownerEmail;
    private EquipmentOrder orderLabelledWithOrganization;
    private EquipmentOrder orderLabelledWithProfileName;
    private EquipmentOrder foreignOrder;

    @BeforeEach
    void setUp() {
        ownerEmail = UUID.randomUUID() + "@medtrack.test";
        User owner = userRepository.save(User.builder()
                .name("City General Admin")
                .username("owner-" + UUID.randomUUID())
                .email(ownerEmail)
                .password("irrelevant-but-at-least-six")
                .role("hospital")
                .phone("+1 (555) 000-0000")
                .organization(ORGANIZATION)
                .accountStatus(AccountStatus.ACTIVE)
                .build());
        hospital = hospitalRepository.save(Hospital.builder()
                .name(PROFILE_NAME)
                .location("Test City")
                .user(owner)
                .build());

        // What placeOrder writes.
        orderLabelledWithOrganization = saveOrder("ORD-ORG", ORGANIZATION, "Delivered", "4000.00");
        // What acceptQuote wrote - same hospital, other label.
        orderLabelledWithProfileName = saveOrder("ORD-PROFILE", PROFILE_NAME, "Delivered", "6000.00");
        // Trailing whitespace and case drift are the same hospital too.
        saveOrder("ORD-CASED", "  city general  ", "Processing", "500.00");
        // A different hospital entirely.
        foreignOrder = saveOrder("ORD-OTHER", "Riverside Hospital", "Delivered", "9999.00");
    }

    @Test
    void aHospitalUserSeesOrdersUnderBothLabels() {
        Page<EquipmentOrder> page = orderRepository.findVisibleToHospitalUser(
                ORGANIZATION, ownerEmail, PageRequest.of(0, 20));

        Set<String> codes = page.getContent().stream()
                .map(EquipmentOrder::getOrderCode)
                .collect(Collectors.toSet());
        assertTrue(codes.contains("ORD-ORG"), "the organisation-labelled order is theirs");
        assertTrue(codes.contains("ORD-PROFILE"),
                "the profile-name-labelled order is theirs too - this is the one that used to vanish");
        assertTrue(codes.contains("ORD-CASED"), "case and padding do not make it a different hospital");
        assertFalse(codes.contains("ORD-OTHER"), "another hospital's order stays out");
        assertEquals(3, page.getTotalElements());
    }

    @Test
    void theUnpagedHistoryMatchesTheSameSet() {
        List<EquipmentOrder> history = orderRepository.findVisibleToHospitalUser(ORGANIZATION, ownerEmail);

        assertEquals(3, history.size());
        assertTrue(history.stream().noneMatch(order -> order.getId().equals(foreignOrder.getId())));
    }

    @Test
    void anOrderCreatedByAcceptingAQuoteCanBeOpenedByItsOwnHospital() {
        assertTrue(orderRepository.findVisibleToHospitalUserById(
                        orderLabelledWithProfileName.getId(), ORGANIZATION, ownerEmail).isPresent(),
                "the hospital that approved the request must be able to open the order it produced");
        assertTrue(orderRepository.findVisibleToHospitalUserById(
                orderLabelledWithOrganization.getId(), ORGANIZATION, ownerEmail).isPresent());
    }

    @Test
    void anotherHospitalsOrderIsStillNotVisible() {
        assertTrue(orderRepository.findVisibleToHospitalUserById(
                        foreignOrder.getId(), ORGANIZATION, ownerEmail).isEmpty(),
                "matching two identities must not mean matching everything");
    }

    @Test
    void analyticsCountsSpendUnderBothLabels() {
        BigDecimal totalSpend = orderRepository.sumTotalCostByHospitalIdAndShippingStatus(
                hospital.getId(), "Delivered");

        // 4000 from the organisation-labelled order plus 6000 from the profile-labelled one. The
        // profile-only query this replaces would have seen 6000; the organisation-only read in
        // OrderService would have seen 4000. Neither was the hospital's spend.
        assertEquals(0, new BigDecimal("10000.00").compareTo(totalSpend), "actual: " + totalSpend);
    }

    @Test
    void analyticsListsDeliveredOrdersUnderBothLabels() {
        List<EquipmentOrder> delivered = orderRepository.findByHospitalIdAndShippingStatus(
                hospital.getId(), "Delivered");

        Set<String> codes = delivered.stream()
                .map(EquipmentOrder::getOrderCode)
                .collect(Collectors.toSet());
        assertEquals(Set.of("ORD-ORG", "ORD-PROFILE"), codes);
    }

    private EquipmentOrder saveOrder(String code, String hospitalLabel, String shippingStatus, String total) {
        return orderRepository.save(EquipmentOrder.builder()
                .orderCode(code)
                .equipmentId("EQ-" + code)
                .equipmentName("Infusion Pump")
                .quantity(2)
                .unitCost(new BigDecimal(total).divide(BigDecimal.valueOf(2)))
                .totalCost(new BigDecimal(total))
                .status("PENDING")
                .shippingStatus(shippingStatus)
                .hospital(hospitalLabel)
                .createdBy("identity-test@medtrack.test")
                .orderDate(LocalDateTime.now().minusDays(5))
                .build());
    }
}
