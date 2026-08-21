package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.ReceivingRecordRequest;
import com.medtrack.model.Hospital;
import com.medtrack.model.ProcurementRequest;
import com.medtrack.model.ProcurementRequestStatus;
import com.medtrack.model.ReceivingRecord;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProcurementReceivingRecordTest {

    private static final Long HOSPITAL_ID = 7L;
    private static final Long REQUEST_ID = 500L;
    private static final String BUYER = "buyer@central.test";

    @Mock
    private ProcurementRequestRepository requestRepository;
    @Mock
    private ReceivingRecordRepository receivingRepository;
    @Mock
    private ProcurementAuditLogRepository auditRepository;
    @Mock
    private HospitalRepository hospitalRepository;
    @Mock
    private UserRepository userRepository;
    
    // Other mocks that might be implicitly injected but unused
    @Mock private ApprovalPolicyRepository policyRepository;
    @Mock private ApprovalPolicyStepRepository policyStepRepository;
    @Mock private ApprovalStepRepository approvalStepRepository;
    @Mock private SupplierQuoteRepository quoteRepository;
    @Mock private InvoiceMatchRecordRepository invoiceRepository;
    @Mock private EquipmentOrderRepository orderRepository;
    @Mock private SupplierAccessGuard supplierAccessGuard;

    @InjectMocks
    private ProcurementService procurementService;

    private ProcurementRequest request;
    private Authentication caller;
    private Hospital hospital;

    @BeforeEach
    void setUp() {
        request = ProcurementRequest.builder()
                .id(REQUEST_ID)
                .hospitalId(HOSPITAL_ID)
                .quantity(10)
                .status(ProcurementRequestStatus.ORDERED)
                .build();

        User user = new User();
        user.setId(10L);
        user.setEmail(BUYER);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setRole("hospital");
        user.setOrganization("City General");

        hospital = new Hospital();
        hospital.setId(HOSPITAL_ID);
        hospital.setName("City General Hospital");
        hospital.setUser(user);

        caller = new UsernamePasswordAuthenticationToken(BUYER, "secret");

        lenient().when(userRepository.findByEmail(BUYER)).thenReturn(Optional.of(user));
        lenient().when(hospitalRepository.findByUserId(10L)).thenReturn(Optional.of(hospital));
    }

    @Test
    void recordReceiving_QuantityNull_ThrowsIllegalArgumentException() {
        ReceivingRecordRequest recordRequest = new ReceivingRecordRequest();
        recordRequest.setQuantityReceived(null);

        when(requestRepository.findByIdAndHospitalId(REQUEST_ID, HOSPITAL_ID)).thenReturn(Optional.of(request));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
            () -> procurementService.recordReceiving(REQUEST_ID, recordRequest, caller));
        assertEquals("Received quantity must be greater than zero", ex.getMessage());
        
        verify(receivingRepository, never()).save(any());
    }

    @Test
    void recordReceiving_QuantityZero_ThrowsIllegalArgumentException() {
        ReceivingRecordRequest recordRequest = new ReceivingRecordRequest();
        recordRequest.setQuantityReceived(0);

        when(requestRepository.findByIdAndHospitalId(REQUEST_ID, HOSPITAL_ID)).thenReturn(Optional.of(request));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
            () -> procurementService.recordReceiving(REQUEST_ID, recordRequest, caller));
        assertEquals("Received quantity must be greater than zero", ex.getMessage());
        
        verify(receivingRepository, never()).save(any());
    }

    @Test
    void recordReceiving_QuantityNegative_ThrowsIllegalArgumentException() {
        ReceivingRecordRequest recordRequest = new ReceivingRecordRequest();
        recordRequest.setQuantityReceived(-5);

        when(requestRepository.findByIdAndHospitalId(REQUEST_ID, HOSPITAL_ID)).thenReturn(Optional.of(request));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
            () -> procurementService.recordReceiving(REQUEST_ID, recordRequest, caller));
        assertEquals("Received quantity must be greater than zero", ex.getMessage());
        
        verify(receivingRepository, never()).save(any());
    }

    @Test
    void recordReceiving_QuantityPositive_Accepted() {
        ReceivingRecordRequest recordRequest = new ReceivingRecordRequest();
        recordRequest.setQuantityReceived(5);

        when(requestRepository.findByIdAndHospitalId(REQUEST_ID, HOSPITAL_ID)).thenReturn(Optional.of(request));
        when(receivingRepository.findByRequestIdOrderByReceivedAtDesc(REQUEST_ID)).thenReturn(Collections.emptyList());
        when(receivingRepository.save(any(ReceivingRecord.class))).thenAnswer(i -> i.getArgument(0));

        var response = procurementService.recordReceiving(REQUEST_ID, recordRequest, caller);
        
        assertNotNull(response);
        assertEquals(5, response.getQuantityReceived());
        verify(receivingRepository, times(1)).save(any(ReceivingRecord.class));
    }
}
