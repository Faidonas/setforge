package com.fazariadis.strengthcoach.mapper;

import com.fazariadis.strengthcoach.dto.ExerciseResponse;
import com.fazariadis.strengthcoach.entity.Exercise;
import org.springframework.stereotype.Component;

@Component
public class ExerciseMapper {

	public ExerciseResponse toResponse(Exercise exercise) {
		return ExerciseResponse.builder()
				.id(exercise.getId())
				.name(exercise.getName())
				.primaryMuscle(exercise.getPrimaryMuscle())
				.equipment(exercise.getEquipment())
				.exerciseType(exercise.getExerciseType())
				.instructions(exercise.getInstructions())
				.build();
	}
}
