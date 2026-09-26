package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.WorkoutTemplateExercise;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutTemplateExerciseRepository
		extends JpaRepository<WorkoutTemplateExercise, Long> {

	@EntityGraph(attributePaths = "exercise")
	List<WorkoutTemplateExercise> findAllByWorkoutTemplate_IdOrderByPositionAsc(
			Long workoutTemplateId);
}
