package com.medtrack.repository;

import com.medtrack.model.RecallNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecallNoticeRepository extends JpaRepository<RecallNotice, Long> {
}
