package com.fazariadis.strengthcoach.mapper;

import com.fazariadis.strengthcoach.dto.ExerciseResponse;
import com.fazariadis.strengthcoach.entity.Exercise;
import org.springframework.stereotype.Component;

@Component
public class ExerciseMapper {

	public ExerciseResponse toResponse(Exercise exercise) {
		return new ExerciseResponse(
				exercise.getId(),
				exercise.getName(),
				exercise.getPrimaryMuscle(),
				exercise.getEquipment(),
				exercise.getInstructions());
	}
}
