package com.fazariadis.strengthcoach.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "An exercise in the SetForge catalogue")
public record ExerciseResponse(
		@Schema(description = "Exercise identifier", example = "1") Long id,
		@Schema(description = "Exercise name", example = "Bench Press") String name,
		@Schema(description = "Primary muscle trained", example = "Chest") String primaryMuscle,
		@Schema(description = "Equipment required", example = "Barbell") String equipment,
		@Schema(description = "Instructions for performing the exercise", nullable = true)
				String instructions) {
}
