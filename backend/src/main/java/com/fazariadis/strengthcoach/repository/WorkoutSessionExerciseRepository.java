package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.WorkoutSessionExercise;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutSessionExerciseRepository
		extends JpaRepository<WorkoutSessionExercise, Long> {

	List<WorkoutSessionExercise> findAllByWorkoutSession_IdOrderByPositionAsc(Long workoutSessionId);
}
