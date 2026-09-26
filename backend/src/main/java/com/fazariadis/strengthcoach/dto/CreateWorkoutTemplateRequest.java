package com.fazariadis.strengthcoach.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "A new reusable workout plan")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWorkoutTemplateRequest {

	@NotNull
	@Schema(description = "User who owns the template", example = "1")
	private Long ownerId;

	@NotBlank
	@Size(max = 100)
	@Schema(description = "Template name", example = "Upper Body Strength")
	private String name;

	@Schema(description = "Optional plan description", nullable = true)
	private String description;

	@NotNull
	@Builder.Default
	@Schema(description = "Exercises in performance order")
	private List<@NotNull @Valid WorkoutTemplateExerciseRequest> exercises = new ArrayList<>();
}
