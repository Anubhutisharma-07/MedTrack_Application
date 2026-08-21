package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.model.Hospital;
import com.medtrack.model.ProcurementRequest;
import com.medtrack.model.ProcurementRequestStatus;
import com.medtrack.model.SupplierQuote;
import com.medtrack.model.SupplierQuoteStatus;
import com.medtrack.repository.ApprovalPolicyRepository;
import com.medtrack.repository.ApprovalPolicyStepRepository;
import com.medtrack.repository.ApprovalStepRepository;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.InvoiceMatchRecordRepository;
import com.medtrack.repository.ProcurementAuditLogRepository;
import com.medtrack.repository.ProcurementRequestRepository;
import com.medtrack.repository.ReceivingRecordRepository;
import com.medtrack.repository.SupplierQuoteRepository;
import com.medtrack.supplier.security.SupplierAccessGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The last step of the procurement flow turns an accepted quote into an {@link EquipmentOrder}. It
 * used to stamp that order with {@code Hospital.name} while {@code OrderService} filters the order
 * list by {@code User.organization} - two unrelated fields - so the hospital that had just raised,
 * justified and approved the purchase could not see the order it produced.
 *
 * <p>The hospital in these tests has a profile name and an organisation that differ, which is the
 * shape the bug needs and the shape the old code silently assumed away.</p>
 */
@ExtendWith(MockitoExtension.class)
class ProcurementAcceptedQuoteOrderTest {

    private static final Long HOSPITAL_ID = 7L;
    private static final Long REQUEST_ID = 500L;
    private static final Long QUOTE_ID = 800L;
    private static final String PROFILE_NAME = "City General Hospital";
    private static final String ORGANIZATION = "City General";
    private static final String BUYER = "buyer@central.test";

    @Mock
    private ProcurementRequestRepository requestRepository;
    @Mock
    private ApprovalPolicyRepository policyRepository;
    @Mock
    private ApprovalPolicyStepRepository policyStepRepository;
    @Mock
    private ApprovalStepRepository approvalStepRepository;
    @Mock
    private SupplierQuoteRepository quoteRepository;
    @Mock
    private ReceivingRecordRepository receivingRepository;
    @Mock
    private InvoiceMatchRecordRepository invoiceRepository;
    @Mock
    private ProcurementAuditLogRepository auditRepository;
    @Mock
    private EquipmentOrderRepository orderRepository;
    @Mock
    private HospitalRepository hospitalRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SupplierAccessGuard supplierAccessGuard;

    @InjectMocks
    private ProcurementService procurementService;

    private ProcurementRequest request;
    private SupplierQuote quote;
    private Authentication caller;

    @BeforeEach
    void setUp() {
        request = ProcurementRequest.builder()
                .id(REQUEST_ID)
                .requestCode("PR-7-20260812-101500")
                .hospitalId(HOSPITAL_ID)
                .requesterId(90L)
                .requesterEmail(BUYER)
                .equipmentCode("EQ-MRI")
                .equipmentName("MRI Scanner")
                .quantity(4)
                .unitCost(new BigDecimal("30000"))
                .totalCost(new BigDecimal("120000"))
                .status(ProcurementRequestStatus.APPROVED)
                .requestedAt(LocalDateTime.now().minusDays(2))
                .build();

        quote = SupplierQuote.builder()
                .id(QUOTE_ID)
                .requestId(REQUEST_ID)
                .hospitalId(HOSPITAL_ID)
                .supplierId(300L)
                .supplierName("MedSupply")
                .supplierEmail("sales@medsupply.test")
                .quoteAmount(new BigDecimal("118000"))
                .leadTimeDays(21)
                .status(SupplierQuoteStatus.PENDING)
                .submittedAt(LocalDateTime.now().minusDays(1))
                .build();

        when(requestRepository.findByIdAndHospitalId(REQUEST_ID, HOSPITAL_ID))
                .thenReturn(Optional.of(request));
        when(quoteRepository.findByIdAndHospitalId(QUOTE_ID, HOSPITAL_ID)).thenReturn(Optional.of(quote));
        when(quoteRepository.findByRequestIdAndStatusOrderByQuoteAmountAsc(
                REQUEST_ID, SupplierQuoteStatus.PENDING)).thenReturn(List.of(quote));
        when(orderRepository.save(any(EquipmentOrder.class)))
                .thenAnswer(invocation -> {
                    EquipmentOrder saved = invocation.getArgument(0);
                    saved.setId(4242L);
                    return saved;
                });
        lenient().when(requestRepository.save(any(ProcurementRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(approvalStepRepository.findByRequestIdOrderByStepGroupAscIdAsc(REQUEST_ID))
                .thenReturn(List.of());
        lenient().when(quoteRepository.findByRequestIdAndStatusOrderByQuoteAmountAsc(
                REQUEST_ID, SupplierQuoteStatus.ACCEPTED)).thenReturn(List.of(quote));
    }

    @Test
    void theOrderIsLabelledWithTheIdentityTheOrderListFiltersOn() {
        caller = authenticateBuyer();

        procurementService.acceptQuote(REQUEST_ID, QUOTE_ID, caller);

        // OrderService.placeOrder writes User.organization and OrderService reads it back. Writing
        // the hospital profile name here instead is what made the order invisible to its owner.
        assertEquals(ORGANIZATION, capturedOrder().getHospital());
    }

    @Test
    void theQuoteAmountBecomesTheOrderTotalAndTheUnitCostFollowsFromIt() {
        caller = authenticateBuyer();

        procurementService.acceptQuote(REQUEST_ID, QUOTE_ID, caller);

        EquipmentOrder order = capturedOrder();
        // 118000 for 4 units. The whole quote used to be written into unitCost while totalCost -
        // the column spend analytics sums - was left null.
        assertEquals(0, new BigDecimal("118000").compareTo(order.getTotalCost()));
        assertEquals(0, new BigDecimal("29500.00").compareTo(order.getUnitCost()));
        assertEquals(4, order.getQuantity());
    }

    @Test
    void aQuoteForASingleUnitKeepsItsAmountIntact() {
        request.setQuantity(1);
        caller = authenticateBuyer();

        procurementService.acceptQuote(REQUEST_ID, QUOTE_ID, caller);

        EquipmentOrder order = capturedOrder();
        assertEquals(0, new BigDecimal("118000").compareTo(order.getUnitCost()));
        assertEquals(0, new BigDecimal("118000").compareTo(order.getTotalCost()));
    }

    @Test
    void theOrderIsCreatedAlreadyApproved() {
        caller = authenticateBuyer();

        procurementService.acceptQuote(REQUEST_ID, QUOTE_ID, caller);

        // It only exists because an approval chain completed and a quote was formally accepted;
        // leaving it at PENDING_ADMIN_APPROVAL asks for the same decision twice.
        assertEquals(EquipmentOrder.APPROVAL_APPROVED, capturedOrder().getApprovalStatus());
    }

    @Test
    void theRequestIsLinkedToTheOrderItProduced() {
        caller = authenticateBuyer();

        procurementService.acceptQuote(REQUEST_ID, QUOTE_ID, caller);

        assertEquals(ProcurementRequestStatus.ORDERED, request.getStatus());
        assertEquals(4242L, request.getOrderId());
        assertEquals(SupplierQuoteStatus.ACCEPTED, quote.getStatus());
        assertNotNull(quote.getAcceptedAt());
    }

    @Test
    void theProfileNameIsUsedWhenTheAccountHasNoOrganisation() {
        // The column is nullable = false, so an order still has to carry something.
        caller = authenticateBuyerWithoutOrganization();

        procurementService.acceptQuote(REQUEST_ID, QUOTE_ID, caller);

        assertEquals(PROFILE_NAME, capturedOrder().getHospital());
    }

    private EquipmentOrder capturedOrder() {
        ArgumentCaptor<EquipmentOrder> captor = ArgumentCaptor.forClass(EquipmentOrder.class);
        verify(orderRepository).save(captor.capture());
        return captor.getValue();
    }

    private Authentication authenticateBuyer() {
        return authenticate(ORGANIZATION);
    }

    private Authentication authenticateBuyerWithoutOrganization() {
        return authenticate("   ");
    }

    private Authentication authenticate(String organization) {
        User user = new User();
        user.setId(90L);
        user.setEmail(BUYER);
        user.setName("Central Buyer");
        user.setRole("hospital");
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setOrganization(organization);
        when(userRepository.findByEmail(BUYER)).thenReturn(Optional.of(user));

        Hospital hospital = new Hospital();
        hospital.setId(HOSPITAL_ID);
        hospital.setName(PROFILE_NAME);
        when(hospitalRepository.findByUserId(90L)).thenReturn(Optional.of(hospital));

        return new UsernamePasswordAuthenticationToken(
                BUYER, null, List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL")));
    }
}
