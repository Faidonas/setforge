package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.WorkoutSession;
import com.fazariadis.strengthcoach.entity.enums.WorkoutSessionStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {

	List<WorkoutSession> findAllByUser_IdOrderByStartedAtDesc(Long userId);

	List<WorkoutSession> findAllByUser_IdAndStatusOrderByStartedAtDesc(
			Long userId, WorkoutSessionStatus status);
}
