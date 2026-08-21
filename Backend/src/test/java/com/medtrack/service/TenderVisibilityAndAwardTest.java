package com.medtrack.service;

import com.medtrack.auth.model.AccountStatus;
import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.TenderAwardRequest;
import com.medtrack.dto.TenderBidResponse;
import com.medtrack.dto.TenderResponse;
import com.medtrack.model.Hospital;
import com.medtrack.model.Tender;
import com.medtrack.model.TenderBid;
import com.medtrack.model.TenderBidStatus;
import com.medtrack.model.TenderStatus;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.TenderAuditLogRepository;
import com.medtrack.repository.TenderBidRepository;
import com.medtrack.repository.TenderRepository;
import com.medtrack.supplier.security.SupplierAccessGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Supplier visibility over tenders, and which bids may win one (issue #945).
 *
 * <p>Two behaviours are pinned here. A supplier who has priced a tender keeps sight of it after the
 * round closes, because the outcome is the whole reason they took part. And a bid from a superseded
 * round cannot be awarded, because opening a new round asks every supplier to reprice.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tender visibility and award")
class TenderVisibilityAndAwardTest {

    private static final Long HOSPITAL_ID = 3L;
    private static final Long SUPPLIER_ID = 77L;
    private static final Long RIVAL_ID = 78L;
    private static final Long TENDER_ID = 500L;

    @Mock
    private TenderRepository tenderRepository;

    @Mock
    private TenderBidRepository bidRepository;

    @Mock
    private TenderAuditLogRepository auditRepository;

    @Mock
    private HospitalRepository hospitalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SupplierAccessGuard supplierAccessGuard;

    @InjectMocks
    private TenderService tenderService;

    @Mock
    private Authentication authentication;

    private User supplier;

    @BeforeEach
    void setUp() {
        supplier = User.builder()
                .id(SUPPLIER_ID)
                .name("Acme Medical")
                .email("bids@acme.test")
                .role("supplier")
                .accountStatus(AccountStatus.ACTIVE)
                .build();
    }

    private void callerIsTheSupplier() {
        when(supplierAccessGuard.isSupplier(authentication)).thenReturn(true);
        when(supplierAccessGuard.resolveCallerId(authentication)).thenReturn(SUPPLIER_ID);
        when(userRepository.findById(SUPPLIER_ID)).thenReturn(Optional.of(supplier));
    }

    private Tender tender(TenderStatus status, int currentRound, String invited) {
        return Tender.builder()
                .id(TENDER_ID)
                .tenderCode("TND-3-20260101-000000")
                .hospitalId(HOSPITAL_ID)
                .title("Ultrasound replacement")
                .status(status)
                .currentRound(currentRound)
                .invitedSupplierEmails(invited)
                .createdAt(LocalDateTime.now().minusDays(7))
                .build();
    }

    private TenderBid bid(Long id, Long supplierId, int round, TenderBidStatus status, String amount) {
        return TenderBid.builder()
                .id(id)
                .tenderId(TENDER_ID)
                .hospitalId(HOSPITAL_ID)
                .roundNumber(round)
                .supplierId(supplierId)
                .supplierName(supplierId.equals(SUPPLIER_ID) ? "Acme Medical" : "Rival Supplies")
                .supplierEmail(supplierId.equals(SUPPLIER_ID) ? "bids@acme.test" : "bids@rival.test")
                .bidAmount(new BigDecimal(amount))
                .status(status)
                .submittedAt(LocalDateTime.now().minusDays(1))
                .build();
    }

    @Nested
    @DisplayName("supplier tender list")
    class SupplierList {

        @Test
        @DisplayName("a closed tender the supplier bid on stays visible")
        void participationKeepsAClosedTenderVisible() {
            Tender closed = tender(TenderStatus.CLOSED, 1, "bids@acme.test");
            callerIsTheSupplier();
            when(tenderRepository.findByStatusOrderByCreatedAtDesc(TenderStatus.OPEN))
                    .thenReturn(List.of());
            when(bidRepository.findDistinctTenderIdsBySupplierId(SUPPLIER_ID))
                    .thenReturn(List.of(TENDER_ID));
            when(tenderRepository.findByIdInOrderByCreatedAtDesc(List.of(TENDER_ID)))
                    .thenReturn(List.of(closed));
            when(bidRepository.findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(TENDER_ID))
                    .thenReturn(List.of(bid(1L, SUPPLIER_ID, 1, TenderBidStatus.SUBMITTED, "42000")));

            List<TenderResponse> visible = tenderService.listTenders(authentication);

            assertThat(visible).hasSize(1);
            assertThat(visible.get(0).getStatus()).isEqualTo(TenderStatus.CLOSED);
        }

        @Test
        @DisplayName("an awarded tender the supplier bid on stays visible, so the outcome is reachable")
        void participationKeepsAnAwardedTenderVisible() {
            Tender awarded = tender(TenderStatus.AWARDED, 2, "bids@acme.test");
            awarded.setAwardedBidId(9L);
            callerIsTheSupplier();
            when(tenderRepository.findByStatusOrderByCreatedAtDesc(TenderStatus.OPEN))
                    .thenReturn(List.of());
            when(bidRepository.findDistinctTenderIdsBySupplierId(SUPPLIER_ID))
                    .thenReturn(List.of(TENDER_ID));
            when(tenderRepository.findByIdInOrderByCreatedAtDesc(List.of(TENDER_ID)))
                    .thenReturn(List.of(awarded));
            when(bidRepository.findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(TENDER_ID))
                    .thenReturn(List.of(bid(9L, SUPPLIER_ID, 2, TenderBidStatus.ACCEPTED, "39000")));

            List<TenderResponse> visible = tenderService.listTenders(authentication);

            assertThat(visible).hasSize(1);
            assertThat(visible.get(0).getAwardedBidId()).isEqualTo(9L);
        }

        @Test
        @DisplayName("an open tender the supplier is invited to is still listed")
        void invitationStillListsAnOpenTender() {
            Tender open = tender(TenderStatus.OPEN, 1, "bids@acme.test");
            callerIsTheSupplier();
            when(tenderRepository.findByStatusOrderByCreatedAtDesc(TenderStatus.OPEN))
                    .thenReturn(List.of(open));
            when(bidRepository.findDistinctTenderIdsBySupplierId(SUPPLIER_ID)).thenReturn(List.of());
            when(bidRepository.findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(TENDER_ID))
                    .thenReturn(List.of());

            assertThat(tenderService.listTenders(authentication)).hasSize(1);
        }

        @Test
        @DisplayName("an open tender the supplier is not invited to is not listed")
        void uninvitedOpenTendersStayHidden() {
            Tender open = tender(TenderStatus.OPEN, 1, "someone@else.test");
            callerIsTheSupplier();
            when(tenderRepository.findByStatusOrderByCreatedAtDesc(TenderStatus.OPEN))
                    .thenReturn(List.of(open));
            when(bidRepository.findDistinctTenderIdsBySupplierId(SUPPLIER_ID)).thenReturn(List.of());

            assertThat(tenderService.listTenders(authentication)).isEmpty();
        }

        @Test
        @DisplayName("a tender that is both invited and bid on appears once")
        void noDuplicatesWhenBothRulesMatch() {
            Tender open = tender(TenderStatus.OPEN, 1, "bids@acme.test");
            callerIsTheSupplier();
            when(tenderRepository.findByStatusOrderByCreatedAtDesc(TenderStatus.OPEN))
                    .thenReturn(List.of(open));
            when(bidRepository.findDistinctTenderIdsBySupplierId(SUPPLIER_ID))
                    .thenReturn(List.of(TENDER_ID));
            when(tenderRepository.findByIdInOrderByCreatedAtDesc(List.of(TENDER_ID)))
                    .thenReturn(List.of(open));
            when(bidRepository.findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(TENDER_ID))
                    .thenReturn(List.of(bid(1L, SUPPLIER_ID, 1, TenderBidStatus.SUBMITTED, "42000")));

            assertThat(tenderService.listTenders(authentication)).hasSize(1);
        }

        @Test
        @DisplayName("the list never carries a competitor's bid")
        void competitorBidsStaySealedInTheListView() {
            Tender open = tender(TenderStatus.OPEN, 1, "bids@acme.test");
            callerIsTheSupplier();
            when(tenderRepository.findByStatusOrderByCreatedAtDesc(TenderStatus.OPEN))
                    .thenReturn(List.of(open));
            when(bidRepository.findDistinctTenderIdsBySupplierId(SUPPLIER_ID)).thenReturn(List.of());
            when(bidRepository.findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(TENDER_ID))
                    .thenReturn(List.of(
                            bid(1L, SUPPLIER_ID, 1, TenderBidStatus.SUBMITTED, "42000"),
                            bid(2L, RIVAL_ID, 1, TenderBidStatus.SUBMITTED, "38000")));

            List<TenderBidResponse> bids = tenderService.listTenders(authentication).get(0).getBids();

            assertThat(bids).hasSize(1);
            assertThat(bids.get(0).getSupplierId()).isEqualTo(SUPPLIER_ID);
        }
    }

    @Nested
    @DisplayName("supplier tender detail")
    class SupplierDetail {

        @Test
        @DisplayName("a supplier who bid may open the tender even after the invite list moves on")
        void participationGrantsDetailAccess() {
            Tender closed = tender(TenderStatus.CLOSED, 2, "someone@else.test");
            callerIsTheSupplier();
            when(tenderRepository.findById(TENDER_ID)).thenReturn(Optional.of(closed));
            when(bidRepository.findDistinctTenderIdsBySupplierId(SUPPLIER_ID))
                    .thenReturn(List.of(TENDER_ID));
            when(bidRepository.findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(TENDER_ID))
                    .thenReturn(List.of(bid(1L, SUPPLIER_ID, 1, TenderBidStatus.REJECTED, "42000")));

            assertThat(tenderService.getTender(TENDER_ID, authentication)).isNotNull();
        }

        @Test
        @DisplayName("a supplier with neither an invitation nor a bid is refused")
        void strangersAreStillRefused() {
            Tender closed = tender(TenderStatus.CLOSED, 2, "someone@else.test");
            callerIsTheSupplier();
            when(tenderRepository.findById(TENDER_ID)).thenReturn(Optional.of(closed));
            when(bidRepository.findDistinctTenderIdsBySupplierId(SUPPLIER_ID)).thenReturn(List.of());

            assertThatThrownBy(() -> tenderService.getTender(TENDER_ID, authentication))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("listBids refuses a supplier with no connection to the tender")
        void listBidsAppliesTheSameRule() {
            Tender closed = tender(TenderStatus.CLOSED, 2, "someone@else.test");
            callerIsTheSupplier();
            when(tenderRepository.findById(TENDER_ID)).thenReturn(Optional.of(closed));
            when(bidRepository.findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(TENDER_ID))
                    .thenReturn(List.of(bid(2L, RIVAL_ID, 2, TenderBidStatus.SUBMITTED, "38000")));
            when(bidRepository.findDistinctTenderIdsBySupplierId(SUPPLIER_ID)).thenReturn(List.of());

            assertThatThrownBy(() -> tenderService.listBids(TENDER_ID, authentication))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("award")
    class Award {

        private final User hospitalUser = User.builder()
                .id(1L)
                .email("procurement@hospital.test")
                .role("hospital")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        private void callerIsTheHospital() {
            lenient().when(supplierAccessGuard.isSupplier(authentication)).thenReturn(false);
            when(authentication.getName()).thenReturn("procurement@hospital.test");
            when(userRepository.findByEmail("procurement@hospital.test"))
                    .thenReturn(Optional.of(hospitalUser));
            when(hospitalRepository.findByUserId(1L)).thenReturn(Optional.of(
                    Hospital.builder().id(HOSPITAL_ID).name("City General").build()));
        }

        @Test
        @DisplayName("a bid from a superseded round cannot win")
        void staleRoundBidIsRejected() {
            Tender atRoundThree = tender(TenderStatus.CLOSED, 3, "bids@acme.test");
            callerIsTheHospital();
            when(tenderRepository.findByIdAndHospitalId(TENDER_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(atRoundThree));
            when(bidRepository.findByIdAndTenderId(1L, TENDER_ID))
                    .thenReturn(Optional.of(bid(1L, SUPPLIER_ID, 1, TenderBidStatus.SUBMITTED, "42000")));

            assertThatThrownBy(() -> tenderService.awardTender(
                    TENDER_ID, TenderAwardRequest.builder().bidId(1L).build(), authentication))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("current round (3)")
                    .hasMessageContaining("round 1");

            verify(tenderRepository, never()).save(any(Tender.class));
        }

        @Test
        @DisplayName("a bid already decided in an earlier award cannot win")
        void nonLiveBidIsRejected() {
            Tender atRoundTwo = tender(TenderStatus.CLOSED, 2, "bids@acme.test");
            callerIsTheHospital();
            when(tenderRepository.findByIdAndHospitalId(TENDER_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(atRoundTwo));
            when(bidRepository.findByIdAndTenderId(4L, TENDER_ID))
                    .thenReturn(Optional.of(bid(4L, SUPPLIER_ID, 2, TenderBidStatus.REJECTED, "42000")));

            assertThatThrownBy(() -> tenderService.awardTender(
                    TENDER_ID, TenderAwardRequest.builder().bidId(4L).build(), authentication))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("REJECTED");
        }

        @Test
        @DisplayName("a withdrawn bid still cannot win")
        void withdrawnBidIsRejected() {
            Tender atRoundOne = tender(TenderStatus.OPEN, 1, "bids@acme.test");
            callerIsTheHospital();
            when(tenderRepository.findByIdAndHospitalId(TENDER_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(atRoundOne));
            when(bidRepository.findByIdAndTenderId(5L, TENDER_ID))
                    .thenReturn(Optional.of(bid(5L, SUPPLIER_ID, 1, TenderBidStatus.WITHDRAWN, "42000")));

            assertThatThrownBy(() -> tenderService.awardTender(
                    TENDER_ID, TenderAwardRequest.builder().bidId(5L).build(), authentication))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("withdrawn");
        }

        @Test
        @DisplayName("a live bid from the current round wins and every other live bid is rejected")
        void currentRoundBidWins() {
            Tender atRoundTwo = tender(TenderStatus.CLOSED, 2, "bids@acme.test");
            TenderBid winner = bid(6L, SUPPLIER_ID, 2, TenderBidStatus.SUBMITTED, "39000");
            TenderBid rival = bid(7L, RIVAL_ID, 2, TenderBidStatus.SUBMITTED, "41000");
            TenderBid stale = bid(8L, RIVAL_ID, 1, TenderBidStatus.REJECTED, "45000");

            callerIsTheHospital();
            when(tenderRepository.findByIdAndHospitalId(TENDER_ID, HOSPITAL_ID))
                    .thenReturn(Optional.of(atRoundTwo));
            when(bidRepository.findByIdAndTenderId(6L, TENDER_ID)).thenReturn(Optional.of(winner));
            when(bidRepository.findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(TENDER_ID))
                    .thenReturn(List.of(winner, rival, stale));

            TenderResponse response = tenderService.awardTender(
                    TENDER_ID,
                    TenderAwardRequest.builder().bidId(6L).reason("Best price and lead time").build(),
                    authentication);

            assertThat(response.getStatus()).isEqualTo(TenderStatus.AWARDED);
            assertThat(response.getAwardedBidId()).isEqualTo(6L);
            assertThat(winner.getStatus()).isEqualTo(TenderBidStatus.ACCEPTED);
            assertThat(rival.getStatus()).isEqualTo(TenderBidStatus.REJECTED);
            assertThat(stale.getStatus())
                    .as("a bid already decided in an earlier round is left as it was")
                    .isEqualTo(TenderBidStatus.REJECTED);
            verify(auditRepository).save(any());
        }
    }
}
