package com.fazariadis.strengthcoach.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "A reusable workout plan with its ordered exercises and sets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutTemplateResponse {

	private Long id;
	private Long ownerId;
	private String name;
	private String description;
	private List<WorkoutTemplateExerciseResponse> exercises;
	private Instant createdAt;
	private Instant updatedAt;
}
