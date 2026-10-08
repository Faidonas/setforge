package com.fazariadis.strengthcoach.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Starts an empty workout or a workout copied from a template")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartWorkoutSessionRequest {

	private Long userId;

	@Schema(description = "Optional template to copy into the workout")
	private Long templateId;

	@Schema(description = "Optional completed workout to perform again")
	private Long sourceWorkoutSessionId;

	@Size(max = 100)
	@Schema(description = "Optional name for an empty workout", example = "Evening Workout")
	private String name;
}
