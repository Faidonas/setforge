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

@Schema(description = "Updates the saved details and results of a completed workout")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWorkoutSessionRequest {

	@NotBlank
	@Size(max = 100)
	private String name;

	private String notes;

	@NotNull
	@Builder.Default
	private List<@NotNull @Valid WorkoutSessionExerciseRequest> exercises = new ArrayList<>();
}
