package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.WorkoutTemplateExercise;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutTemplateExerciseRepository
		extends JpaRepository<WorkoutTemplateExercise, Long> {

	List<WorkoutTemplateExercise> findAllByWorkoutTemplate_IdOrderByPositionAsc(
			Long workoutTemplateId);
}
