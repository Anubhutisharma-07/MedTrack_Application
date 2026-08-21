package com.medtrack.repository;

import com.medtrack.model.TenderBid;
import com.medtrack.model.TenderBidStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenderBidRepository extends JpaRepository<TenderBid, Long> {

    List<TenderBid> findByTenderIdOrderByRoundNumberDescSubmittedAtAsc(Long tenderId);

    List<TenderBid> findByTenderIdAndRoundNumberOrderByBidAmountAsc(Long tenderId, Integer roundNumber);

    List<TenderBid> findByTenderIdAndRoundNumberOrderBySubmittedAtAsc(Long tenderId, Integer roundNumber);

    List<TenderBid> findBySupplierIdOrderBySubmittedAtDesc(Long supplierId);

    Optional<TenderBid> findByIdAndTenderId(Long id, Long tenderId);

    Optional<TenderBid> findByIdAndTenderIdAndSupplierId(Long id, Long tenderId, Long supplierId);

    Optional<TenderBid> findByTenderIdAndSupplierIdAndRoundNumberAndStatus(
            Long tenderId, Long supplierId, Integer roundNumber, TenderBidStatus status);

    long countByTenderIdAndRoundNumber(Long tenderId, Integer roundNumber);

    /**
     * The tenders this supplier has taken part in.
     *
     * <p>Drives the supplier's tender list: participation is what keeps a tender visible after the
     * round closes, so the supplier can see how the competition they priced actually settled. A
     * projection rather than {@code findBySupplierIdOrderBySubmittedAtDesc} because only the ids
     * are needed and a prolific supplier's bid history is far larger than its tender list.</p>
     *
     * <p>Withdrawn bids count. Withdrawing removes an offer, not the right to see the outcome.</p>
     */
    @Query("SELECT DISTINCT b.tenderId FROM TenderBid b WHERE b.supplierId = :supplierId")
    List<Long> findDistinctTenderIdsBySupplierId(@Param("supplierId") Long supplierId);

    boolean existsByTenderIdAndSupplierIdAndRoundNumberAndStatus(
            Long tenderId, Long supplierId, Integer roundNumber, TenderBidStatus status);
}
