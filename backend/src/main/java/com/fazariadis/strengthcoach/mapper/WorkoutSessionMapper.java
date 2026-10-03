package com.fazariadis.strengthcoach.mapper;

import com.fazariadis.strengthcoach.dto.WorkoutSessionExerciseResponse;
import com.fazariadis.strengthcoach.dto.WorkoutSessionResponse;
import com.fazariadis.strengthcoach.dto.WorkoutSetResponse;
import com.fazariadis.strengthcoach.entity.WorkoutSession;
import com.fazariadis.strengthcoach.entity.WorkoutSessionExercise;
import com.fazariadis.strengthcoach.entity.WorkoutSet;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class WorkoutSessionMapper {

	public WorkoutSessionResponse toResponse(
			WorkoutSession session,
			List<WorkoutSessionExercise> sessionExercises,
			Map<Long, List<WorkoutSet>> setsByExerciseId) {
		return WorkoutSessionResponse.builder()
				.id(session.getId())
				.userId(session.getUser().getId())
				.sourceTemplateId(session.getSourceTemplate() == null
						? null
						: session.getSourceTemplate().getId())
				.name(session.getName())
				.notes(session.getNotes())
				.status(session.getStatus())
				.startedAt(session.getStartedAt())
				.completedAt(session.getCompletedAt())
				.exercises(sessionExercises.stream()
						.map(exercise -> toExerciseResponse(
								exercise,
								setsByExerciseId.getOrDefault(exercise.getId(), List.of())))
						.toList())
				.build();
	}

	private WorkoutSessionExerciseResponse toExerciseResponse(
			WorkoutSessionExercise sessionExercise, List<WorkoutSet> sets) {
		return WorkoutSessionExerciseResponse.builder()
				.id(sessionExercise.getId())
				.exerciseId(sessionExercise.getExercise().getId())
				.exerciseName(sessionExercise.getExercise().getName())
				.primaryMuscle(sessionExercise.getExercise().getPrimaryMuscle())
				.equipment(sessionExercise.getExercise().getEquipment())
				.exerciseType(sessionExercise.getExercise().getExerciseType())
				.thumbnailUrl(sessionExercise.getExercise().getThumbnailUrl())
				.position(sessionExercise.getPosition())
				.notes(sessionExercise.getNotes())
				.sets(sets.stream().map(this::toSetResponse).toList())
				.build();
	}

	private WorkoutSetResponse toSetResponse(WorkoutSet set) {
		return WorkoutSetResponse.builder()
				.id(set.getId())
				.position(set.getPosition())
				.setType(set.getSetType())
				.targetReps(set.getTargetReps())
				.targetWeight(set.getTargetWeight())
				.targetTimeSeconds(set.getTargetTimeSeconds())
				.restSeconds(set.getRestSeconds())
				.reps(set.getReps())
				.weight(set.getWeight())
				.timeSeconds(set.getTimeSeconds())
				.completed(set.isCompleted())
				.completedAt(set.getCompletedAt())
				.build();
	}
}
