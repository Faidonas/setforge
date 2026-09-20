package com.fazariadis.strengthcoach.dto;

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

	@Schema(description = "Instructions for performing the exercise", nullable = true)
	private String instructions;
}
