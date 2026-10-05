package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.WorkoutSessionExercise;
import com.fazariadis.strengthcoach.entity.enums.WorkoutSessionStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutSessionExerciseRepository
		extends JpaRepository<WorkoutSessionExercise, Long> {

	List<WorkoutSessionExercise> findAllByWorkoutSession_IdOrderByPositionAsc(Long workoutSessionId);

	List<WorkoutSessionExercise>
			findAllByWorkoutSession_User_IdAndWorkoutSession_StatusAndExercise_IdOrderByWorkoutSession_CompletedAtDesc(
					Long userId, WorkoutSessionStatus status, Long exerciseId);
}
