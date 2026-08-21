package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.ApprovalDecisionRequest;
import com.medtrack.dto.ApprovalStepResponse;
import com.medtrack.model.ApprovalStep;
import com.medtrack.model.ApprovalStepStatus;
import com.medtrack.model.Hospital;
import com.medtrack.model.ProcurementRequest;
import com.medtrack.model.ProcurementRequestStatus;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The approval chain is the procurement module's spending control: a policy names who signs, in
 * what order, and the audit trail is supposed to be the evidence that it happened that way.
 *
 * <p>Before this was fixed, {@code approveStep} checked only that the caller was an active hospital
 * user in the same tenant. The {@code approverEmail}, {@code approverRole} and {@code stepGroup}
 * columns were written at request time, returned in the API response, and enforced nowhere - so any
 * colleague could clear a three-stage chain alone, in any order.</p>
 */
@ExtendWith(MockitoExtension.class)
class ProcurementApprovalRoutingTest {

    private static final Long HOSPITAL_ID = 7L;
    private static final Long REQUEST_ID = 500L;

    private static final String DEPARTMENT_HEAD = "dept.head@central.test";
    private static final String FINANCE = "finance@central.test";
    private static final String DIRECTOR = "director@central.test";
    private static final String REQUESTER = "buyer@central.test";

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
    private List<ApprovalStep> chain;

    @BeforeEach
    void setUp() {
        request = ProcurementRequest.builder()
                .id(REQUEST_ID)
                .requestCode("PR-7-20260812-101500")
                .hospitalId(HOSPITAL_ID)
                .requesterId(90L)
                .requesterEmail(REQUESTER)
                .equipmentCode("EQ-MRI")
                .equipmentName("MRI Scanner")
                .quantity(1)
                .unitCost(new BigDecimal("120000"))
                .totalCost(new BigDecimal("120000"))
                .status(ProcurementRequestStatus.AWAITING_APPROVAL)
                .requestedAt(LocalDateTime.now().minusDays(1))
                .build();

        // A three-stage policy: department head, then finance, then director.
        chain = new ArrayList<>(List.of(
                step(1L, 1, "hospital", DEPARTMENT_HEAD),
                step(2L, 2, "hospital", FINANCE),
                step(3L, 3, "hospital", DIRECTOR)));
    }

    // ------------------------------------------------------------------
    // Routing
    // ------------------------------------------------------------------

    @Test
    void namedApproverCanDecideTheStepRoutedToThem() {
        Authentication caller = hospitalUser(DEPARTMENT_HEAD, 91L);
        stubChain();
        stubStepLookup(1L);
        stubRequestLookup();
        stubResponseAssembly();

        procurementService.approveStep(1L, approve(), caller);

        assertEquals(ApprovalStepStatus.APPROVED, chain.get(0).getStatus());
        assertEquals(DEPARTMENT_HEAD, chain.get(0).getDecidedBy());
    }

    @Test
    void aStepRoutedToSomeoneElseCannotBeDecided() {
        Authentication caller = hospitalUser(FINANCE, 92L);
        stubChain();
        stubStepLookup(1L);
        stubRequestLookup();

        AccessDeniedException thrown = assertThrows(AccessDeniedException.class,
                () -> procurementService.approveStep(1L, approve(), caller));

        // The message names who the step is waiting on, so the caller knows who to chase.
        assertTrue(thrown.getMessage().contains(DEPARTMENT_HEAD), thrown.getMessage());
        verify(approvalStepRepository, never()).save(any());
    }

    @Test
    void rejectionIsSubjectToTheSameRoutingAsApproval() {
        Authentication caller = hospitalUser(FINANCE, 92L);
        stubChain();
        stubStepLookup(1L);
        stubRequestLookup();

        assertThrows(AccessDeniedException.class,
                () -> procurementService.approveStep(1L, reject(), caller));

        // Nothing was decided, so the request is untouched rather than rejected.
        verify(approvalStepRepository, never()).save(any());
        verify(requestRepository, never()).save(any());
        assertEquals(ProcurementRequestStatus.AWAITING_APPROVAL, request.getStatus());
    }

    @Test
    void aStepNamingAnAccountRoleRequiresThatRole() {
        // materializeApprovalSteps lower-cases the role; "technician" is a real account role, so it
        // is enforceable and a hospital user does not hold it.
        chain.set(0, step(1L, 1, "technician", null));
        Authentication caller = hospitalUser(DEPARTMENT_HEAD, 91L);
        stubChain();
        stubStepLookup(1L);
        stubRequestLookup();

        AccessDeniedException thrown = assertThrows(AccessDeniedException.class,
                () -> procurementService.approveStep(1L, approve(), caller));

        assertTrue(thrown.getMessage().contains("technician"), thrown.getMessage());
    }

    @Test
    void aDescriptiveRoleLabelIsNotTreatedAsAnAuthority() {
        // "finance" is not a role the account model can hold. Enforcing it would make the step
        // undecidable by anyone, so it is left as a stage label and the step stays open.
        chain.set(0, step(1L, 1, "finance", null));
        Authentication caller = hospitalUser(DEPARTMENT_HEAD, 91L);
        stubChain();
        stubStepLookup(1L);
        stubRequestLookup();
        stubResponseAssembly();

        procurementService.approveStep(1L, approve(), caller);

        assertEquals(ApprovalStepStatus.APPROVED, chain.get(0).getStatus());
    }

    @Test
    void theSingleStepFallbackChainStillWorks() {
        // materializeApprovalSteps falls back to one "hospital" step with no named approver when a
        // policy has no steps of its own. That has to stay decidable by any hospital user.
        chain = new ArrayList<>(List.of(step(1L, 1, "hospital", null)));
        Authentication caller = hospitalUser(DEPARTMENT_HEAD, 91L);
        stubChain();
        stubStepLookup(1L);
        stubRequestLookup();
        stubResponseAssembly();

        procurementService.approveStep(1L, approve(), caller);

        assertEquals(ApprovalStepStatus.APPROVED, chain.get(0).getStatus());
    }

    // ------------------------------------------------------------------
    // Sequence
    // ------------------------------------------------------------------

    @Test
    void aLaterGroupCannotBeDecidedWhileAnEarlierGroupIsOpen() {
        Authentication caller = hospitalUser(DIRECTOR, 93L);
        stubChain();
        stubStepLookup(3L);
        stubRequestLookup();

        IllegalArgumentException thrown = assertThrows(IllegalArgumentException.class,
                () -> procurementService.approveStep(3L, approve(), caller));

        assertTrue(thrown.getMessage().contains("group 1"), thrown.getMessage());
        verify(approvalStepRepository, never()).save(any());
    }

    @Test
    void aLaterGroupOpensOnceEveryEarlierGroupIsApproved() {
        chain.get(0).setStatus(ApprovalStepStatus.APPROVED);
        chain.get(0).setDecidedBy(DEPARTMENT_HEAD);
        chain.get(1).setStatus(ApprovalStepStatus.APPROVED);
        chain.get(1).setDecidedBy(FINANCE);
        Authentication caller = hospitalUser(DIRECTOR, 93L);
        stubChain();
        stubStepLookup(3L);
        stubRequestLookup();
        stubResponseAssembly();

        procurementService.approveStep(3L, approve(), caller);

        assertEquals(ApprovalStepStatus.APPROVED, chain.get(2).getStatus());
        // Last step in the chain, so the request itself is approved.
        assertEquals(ProcurementRequestStatus.APPROVED, request.getStatus());
    }

    @Test
    void stepsSharingAGroupStayParallel() {
        // Two approvers in group 1, one already approved. The second is not blocked by the first.
        chain = new ArrayList<>(List.of(
                approved(step(1L, 1, "hospital", DEPARTMENT_HEAD), DEPARTMENT_HEAD),
                step(2L, 1, "hospital", FINANCE)));
        Authentication caller = hospitalUser(FINANCE, 92L);
        stubChain();
        stubStepLookup(2L);
        stubRequestLookup();
        stubResponseAssembly();

        procurementService.approveStep(2L, approve(), caller);

        assertEquals(ApprovalStepStatus.APPROVED, chain.get(1).getStatus());
    }

    // ------------------------------------------------------------------
    // Four eyes
    // ------------------------------------------------------------------

    @Test
    void oneApproverCannotClearTwoGroupsOnTheSameRequest() {
        // The chain is routed by role rather than by name, so nothing stops the same person
        // reaching both steps - except this rule.
        chain = new ArrayList<>(List.of(
                approved(step(1L, 1, "hospital", null), DEPARTMENT_HEAD),
                step(2L, 2, "hospital", null)));
        Authentication caller = hospitalUser(DEPARTMENT_HEAD, 91L);
        stubChain();
        stubStepLookup(2L);
        stubRequestLookup();

        AccessDeniedException thrown = assertThrows(AccessDeniedException.class,
                () -> procurementService.approveStep(2L, approve(), caller));

        assertTrue(thrown.getMessage().contains("group 1"), thrown.getMessage());
        verify(approvalStepRepository, never()).save(any());
    }

    @Test
    void aDifferentApproverClearsTheSecondGroup() {
        chain = new ArrayList<>(List.of(
                approved(step(1L, 1, "hospital", null), DEPARTMENT_HEAD),
                step(2L, 2, "hospital", null)));
        Authentication caller = hospitalUser(FINANCE, 92L);
        stubChain();
        stubStepLookup(2L);
        stubRequestLookup();
        stubResponseAssembly();

        procurementService.approveStep(2L, approve(), caller);

        assertEquals(ApprovalStepStatus.APPROVED, chain.get(1).getStatus());
        assertEquals(ProcurementRequestStatus.APPROVED, request.getStatus());
    }

    @Test
    void theHighValueSelfApprovalThresholdStillApplies() {
        chain = new ArrayList<>(List.of(step(1L, 1, "hospital", REQUESTER)));
        Authentication caller = hospitalUser(REQUESTER, 90L);
        stubChain();
        stubStepLookup(1L);
        stubRequestLookup();

        AccessDeniedException thrown = assertThrows(AccessDeniedException.class,
                () -> procurementService.approveStep(1L, approve(), caller));

        assertTrue(thrown.getMessage().contains("high-value"), thrown.getMessage());
    }

    // ------------------------------------------------------------------
    // Inbox
    // ------------------------------------------------------------------

    @Test
    void theInboxOnlyListsStepsTheCallerCanActuallyDecide() {
        Authentication caller = hospitalUser(FINANCE, 92L);
        when(approvalStepRepository.findByHospitalIdAndStatusOrderByCreatedAtAsc(
                HOSPITAL_ID, ApprovalStepStatus.PENDING)).thenReturn(chain);
        stubChain();

        List<ApprovalStepResponse> inbox = procurementService.getApprovalInbox(caller);

        // Group 1 is routed to someone else, group 2 is theirs but blocked behind group 1, and
        // group 3 is neither. Nothing is actionable yet.
        assertEquals(List.of(), inbox);
    }

    @Test
    void theInboxShowsAStepOnceItsTurnComesAround() {
        chain.get(0).setStatus(ApprovalStepStatus.APPROVED);
        chain.get(0).setDecidedBy(DEPARTMENT_HEAD);
        Authentication caller = hospitalUser(FINANCE, 92L);
        when(approvalStepRepository.findByHospitalIdAndStatusOrderByCreatedAtAsc(
                HOSPITAL_ID, ApprovalStepStatus.PENDING))
                .thenReturn(List.of(chain.get(1), chain.get(2)));
        stubChain();

        List<ApprovalStepResponse> inbox = procurementService.getApprovalInbox(caller);

        assertEquals(1, inbox.size());
        assertEquals(2L, inbox.get(0).getId());
    }

    // ------------------------------------------------------------------
    // Fixtures
    // ------------------------------------------------------------------

    private ApprovalStep step(Long id, int group, String role, String email) {
        return ApprovalStep.builder()
                .id(id)
                .requestId(REQUEST_ID)
                .hospitalId(HOSPITAL_ID)
                .stepGroup(group)
                .approverRole(role)
                .approverEmail(email)
                .status(ApprovalStepStatus.PENDING)
                .createdAt(LocalDateTime.now().minusHours(group))
                .build();
    }

    private ApprovalStep approved(ApprovalStep step, String decidedBy) {
        step.setStatus(ApprovalStepStatus.APPROVED);
        step.setDecidedBy(decidedBy);
        step.setDecidedAt(LocalDateTime.now().minusMinutes(30));
        return step;
    }

    private ApprovalDecisionRequest approve() {
        ApprovalDecisionRequest decision = new ApprovalDecisionRequest();
        decision.setApprove(true);
        decision.setComment("Approved");
        return decision;
    }

    private ApprovalDecisionRequest reject() {
        ApprovalDecisionRequest decision = new ApprovalDecisionRequest();
        decision.setApprove(false);
        decision.setComment("Not this quarter");
        return decision;
    }

    private Authentication hospitalUser(String email, Long id) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setName(email);
        user.setRole("hospital");
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setOrganization("Central Hospital");
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        Hospital hospital = new Hospital();
        hospital.setId(HOSPITAL_ID);
        hospital.setName("Central Hospital");
        when(hospitalRepository.findByUserId(id)).thenReturn(Optional.of(hospital));

        return new UsernamePasswordAuthenticationToken(
                email, null, List.of(new SimpleGrantedAuthority("ROLE_HOSPITAL")));
    }

    private void stubChain() {
        lenient().when(approvalStepRepository.findByRequestIdOrderByStepGroupAscIdAsc(REQUEST_ID))
                .thenAnswer(invocation -> chain);
    }

    private void stubStepLookup(Long stepId) {
        ApprovalStep step = chain.stream()
                .filter(candidate -> candidate.getId().equals(stepId))
                .findFirst()
                .orElseThrow();
        when(approvalStepRepository.findByIdAndHospitalId(stepId, HOSPITAL_ID))
                .thenReturn(Optional.of(step));
    }

    private void stubRequestLookup() {
        when(requestRepository.findByIdAndHospitalId(REQUEST_ID, HOSPITAL_ID))
                .thenReturn(Optional.of(request));
    }

    private void stubResponseAssembly() {
        lenient().when(approvalStepRepository.save(any(ApprovalStep.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(requestRepository.save(any(ProcurementRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(quoteRepository.findByRequestIdAndStatusOrderByQuoteAmountAsc(
                        REQUEST_ID, SupplierQuoteStatus.ACCEPTED))
                .thenReturn(List.of());
    }
}
