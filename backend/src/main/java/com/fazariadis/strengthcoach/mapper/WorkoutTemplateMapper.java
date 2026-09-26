package com.fazariadis.strengthcoach.mapper;

import com.fazariadis.strengthcoach.dto.WorkoutTemplateExerciseResponse;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateResponse;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateSetResponse;
import com.fazariadis.strengthcoach.entity.WorkoutTemplate;
import com.fazariadis.strengthcoach.entity.WorkoutTemplateExercise;
import com.fazariadis.strengthcoach.entity.WorkoutTemplateSet;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class WorkoutTemplateMapper {

	public WorkoutTemplateResponse toResponse(
			WorkoutTemplate template,
			List<WorkoutTemplateExercise> templateExercises,
			Map<Long, List<WorkoutTemplateSet>> setsByExerciseId) {
		return WorkoutTemplateResponse.builder()
				.id(template.getId())
				.ownerId(template.getOwner().getId())
				.name(template.getName())
				.description(template.getDescription())
				.exercises(templateExercises.stream()
						.map(templateExercise -> toExerciseResponse(
								templateExercise,
								setsByExerciseId.getOrDefault(templateExercise.getId(), List.of())))
						.toList())
				.createdAt(template.getCreatedAt())
				.updatedAt(template.getUpdatedAt())
				.build();
	}

	private WorkoutTemplateExerciseResponse toExerciseResponse(
			WorkoutTemplateExercise templateExercise, List<WorkoutTemplateSet> sets) {
		return WorkoutTemplateExerciseResponse.builder()
				.id(templateExercise.getId())
				.exerciseId(templateExercise.getExercise().getId())
				.exerciseName(templateExercise.getExercise().getName())
				.primaryMuscle(templateExercise.getExercise().getPrimaryMuscle())
				.equipment(templateExercise.getExercise().getEquipment())
				.exerciseType(templateExercise.getExercise().getExerciseType())
				.position(templateExercise.getPosition())
				.notes(templateExercise.getNotes())
				.sets(sets.stream().map(this::toSetResponse).toList())
				.build();
	}

	private WorkoutTemplateSetResponse toSetResponse(WorkoutTemplateSet templateSet) {
		return WorkoutTemplateSetResponse.builder()
				.id(templateSet.getId())
				.position(templateSet.getPosition())
				.setType(templateSet.getSetType())
				.targetReps(templateSet.getTargetReps())
				.targetWeight(templateSet.getTargetWeight())
				.targetTimeSeconds(templateSet.getTargetTimeSeconds())
				.restSeconds(templateSet.getRestSeconds())
				.build();
	}
}
