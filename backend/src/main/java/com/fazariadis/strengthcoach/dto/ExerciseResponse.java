package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.ExerciseType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "An exercise in the SetForge catalogue")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseResponse {

	@Schema(description = "Exercise identifier", example = "1")
	private Long id;

	@Schema(description = "Exercise name", example = "Bench Press")
	private String name;

	@Schema(description = "Primary muscle trained", example = "Chest")
	private String primaryMuscle;

	@Schema(description = "Equipment required", example = "Barbell")
	private String equipment;

	@Schema(description = "Values recorded for this exercise", example = "WEIGHT_AND_REPS")
	private ExerciseType exerciseType;

	@Schema(description = "Instructions for performing the exercise", nullable = true)
	private String instructions;

	@Schema(description = "Broad body area trained", example = "chest", nullable = true)
	private String bodyPart;

	@Schema(description = "Supporting muscle group", example = "triceps", nullable = true)
	private String muscleGroup;

	@Schema(description = "Comma-separated secondary muscles", nullable = true)
	private String secondaryMuscles;

	@Schema(description = "Practice dataset identifier", example = "0025", nullable = true)
	private String sourceId;

	@Schema(description = "Relative URL of the exercise thumbnail", nullable = true)
	private String thumbnailUrl;

	@Schema(description = "Relative URL of the animated exercise demonstration", nullable = true)
	private String animationUrl;

	@Schema(description = "Required media attribution", nullable = true)
	private String attribution;
}
