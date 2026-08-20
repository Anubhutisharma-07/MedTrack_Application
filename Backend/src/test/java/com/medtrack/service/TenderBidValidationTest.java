package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.TenderBidRequest;
import com.medtrack.model.Tender;
import com.medtrack.model.TenderBid;
import com.medtrack.model.TenderBidStatus;
import com.medtrack.model.TenderStatus;
import com.medtrack.repository.TenderAuditLogRepository;
import com.medtrack.repository.TenderBidRepository;
import com.medtrack.repository.TenderRepository;
import com.medtrack.supplier.security.SupplierAccessGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenderBidValidationTest {

    private static final Long TENDER_ID = 100L;
    private static final Long SUPPLIER_ID = 42L;

    @Mock
    private TenderRepository tenderRepository;
    @Mock
    private TenderBidRepository bidRepository;
    @Mock
    private TenderAuditLogRepository auditRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SupplierAccessGuard supplierAccessGuard;

    @InjectMocks
    private TenderService tenderService;

    private Authentication authentication;
    private Tender tender;
    private User supplier;

    @BeforeEach
    void setUp() {
        authentication = new UsernamePasswordAuthenticationToken("supplier@test.com", "password");
        
        supplier = new User();
        supplier.setId(SUPPLIER_ID);
        supplier.setEmail("supplier@test.com");
        supplier.setName("Acme Medical");

        tender = Tender.builder()
                .id(TENDER_ID)
                .status(TenderStatus.OPEN)
                .hospitalId(1L)
                .currentRound(1)
                .invitedSupplierEmails("supplier@test.com,another@test.com")
                .deadline(LocalDateTime.now().plusDays(5))
                .build();

        lenient().when(supplierAccessGuard.resolveCallerId(authentication)).thenReturn(SUPPLIER_ID);
        lenient().when(userRepository.findById(SUPPLIER_ID)).thenReturn(Optional.of(supplier));
        lenient().when(tenderRepository.findById(TENDER_ID)).thenReturn(Optional.of(tender));
        lenient().when(bidRepository.existsByTenderIdAndSupplierIdAndRoundNumberAndStatus(
                eq(TENDER_ID), eq(SUPPLIER_ID), eq(1), eq(TenderBidStatus.SUBMITTED))).thenReturn(false);
    }

    private TenderBidRequest validRequest() {
        return TenderBidRequest.builder()
                .bidAmount(new BigDecimal("50000"))
                .leadTimeDays(30)
                .qualityScore(85)
                .deliveryScore(90)
                .build();
    }

    @Test
    void submitBid_LeadTimeZero_ThrowsIllegalArgumentException() {
        TenderBidRequest request = validRequest();
        request.setLeadTimeDays(0);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
                () -> tenderService.submitBid(TENDER_ID, request, authentication));
        assertEquals("Lead time must be greater than zero", ex.getMessage());
        verify(bidRepository, never()).save(any());
    }

    @Test
    void submitBid_LeadTimeNegative_ThrowsIllegalArgumentException() {
        TenderBidRequest request = validRequest();
        request.setLeadTimeDays(-5);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
                () -> tenderService.submitBid(TENDER_ID, request, authentication));
        assertEquals("Lead time must be greater than zero", ex.getMessage());
        verify(bidRepository, never()).save(any());
    }

    @Test
    void submitBid_QualityScoreNegative_ThrowsIllegalArgumentException() {
        TenderBidRequest request = validRequest();
        request.setQualityScore(-1);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
                () -> tenderService.submitBid(TENDER_ID, request, authentication));
        assertEquals("Quality score must be between 0 and 100", ex.getMessage());
        verify(bidRepository, never()).save(any());
    }

    @Test
    void submitBid_QualityScoreAbove100_ThrowsIllegalArgumentException() {
        TenderBidRequest request = validRequest();
        request.setQualityScore(101);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
                () -> tenderService.submitBid(TENDER_ID, request, authentication));
        assertEquals("Quality score must be between 0 and 100", ex.getMessage());
        verify(bidRepository, never()).save(any());
    }

    @Test
    void submitBid_DeliveryScoreNegative_ThrowsIllegalArgumentException() {
        TenderBidRequest request = validRequest();
        request.setDeliveryScore(-1);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
                () -> tenderService.submitBid(TENDER_ID, request, authentication));
        assertEquals("Delivery score must be between 0 and 100", ex.getMessage());
        verify(bidRepository, never()).save(any());
    }

    @Test
    void submitBid_DeliveryScoreAbove100_ThrowsIllegalArgumentException() {
        TenderBidRequest request = validRequest();
        request.setDeliveryScore(101);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
                () -> tenderService.submitBid(TENDER_ID, request, authentication));
        assertEquals("Delivery score must be between 0 and 100", ex.getMessage());
        verify(bidRepository, never()).save(any());
    }

    @Test
    void submitBid_BidAmountNegative_ThrowsIllegalArgumentException() {
        TenderBidRequest request = validRequest();
        request.setBidAmount(new BigDecimal("-10"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
                () -> tenderService.submitBid(TENDER_ID, request, authentication));
        assertEquals("Bid amount cannot be negative", ex.getMessage());
        verify(bidRepository, never()).save(any());
    }

    @Test
    void submitBid_ValidScoresAndLeadTime_Accepted() {
        TenderBidRequest request = validRequest();
        request.setQualityScore(0);
        request.setDeliveryScore(100);
        request.setLeadTimeDays(1);

        when(bidRepository.save(any(TenderBid.class))).thenAnswer(i -> {
            TenderBid b = i.getArgument(0);
            b.setId(999L);
            return b;
        });

        var response = tenderService.submitBid(TENDER_ID, request, authentication);
        assertNotNull(response);
        assertEquals(0, response.getQualityScore());
        assertEquals(100, response.getDeliveryScore());
        assertEquals(1, response.getLeadTimeDays());
        
        verify(bidRepository, times(1)).save(any(TenderBid.class));
    }
}
