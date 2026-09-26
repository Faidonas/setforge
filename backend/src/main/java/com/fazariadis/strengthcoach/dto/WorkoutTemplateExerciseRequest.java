package com.fazariadis.strengthcoach.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "An exercise planned within a workout template")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutTemplateExerciseRequest {

	@NotNull
	@Schema(description = "Exercise catalogue identifier", example = "1")
	private Long exerciseId;

	@Schema(description = "Instructions specific to this template", nullable = true)
	private String notes;

	@NotNull
	@Builder.Default
	@Schema(description = "Planned sets in performance order")
	private List<@NotNull @Valid WorkoutTemplateSetRequest> sets = new ArrayList<>();
}
