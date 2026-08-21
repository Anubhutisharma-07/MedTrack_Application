package com.medtrack.repository;

import com.medtrack.model.SparePart;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SparePartRepository extends JpaRepository<SparePart, Long> {

    List<SparePart> findByHospitalId(Long hospitalId);

    @Query("SELECT s FROM SparePart s WHERE s.hospitalId = :hospitalId AND s.deleted = false")
    List<SparePart> findByHospitalIdAndDeletedFalse(@Param("hospitalId") Long hospitalId);

    Optional<SparePart> findByIdAndHospitalId(Long id, Long hospitalId);

    @Query("SELECT s FROM SparePart s WHERE s.id = :id AND s.hospitalId = :hospitalId AND s.deleted = false")
    Optional<SparePart> findByIdAndHospitalIdAndDeletedFalse(
            @Param("id") Long id,
            @Param("hospitalId") Long hospitalId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SparePart s WHERE s.id = :id AND s.hospitalId = :hospitalId AND s.deleted = false")
    Optional<SparePart> findByIdAndHospitalIdForUpdate(
            @Param("id") Long id,
            @Param("hospitalId") Long hospitalId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SparePart s WHERE s.hospitalId = :hospitalId AND LOWER(s.partNumber) = LOWER(:partNumber) AND s.deleted = false")
    Optional<SparePart> findActiveByHospitalIdAndPartNumberForUpdate(
            @Param("hospitalId") Long hospitalId,
            @Param("partNumber") String partNumber);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM SparePart s WHERE s.hospitalId = :hospitalId AND LOWER(s.partNumber) = LOWER(:partNumber) AND s.deleted = false")
    boolean existsByHospitalIdAndPartNumberAndDeletedFalse(
            @Param("hospitalId") Long hospitalId,
            @Param("partNumber") String partNumber);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM SparePart s WHERE s.hospitalId = :hospitalId AND LOWER(s.partNumber) = LOWER(:partNumber) AND s.id <> :id AND s.deleted = false")
    boolean existsByHospitalIdAndPartNumberAndIdNotAndDeletedFalse(
            @Param("hospitalId") Long hospitalId,
            @Param("partNumber") String partNumber,
            @Param("id") Long id);

    @Query("SELECT s FROM SparePart s WHERE s.hospitalId = :hospitalId AND s.deleted = false AND s.stockLevel <= s.reorderPoint")
    List<SparePart> findLowStockPartsByHospitalId(@Param("hospitalId") Long hospitalId);
}
