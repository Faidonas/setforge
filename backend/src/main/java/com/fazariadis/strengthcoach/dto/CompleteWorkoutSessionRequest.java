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

@Schema(description = "The final exercise and set results for a completed workout")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteWorkoutSessionRequest {

	private String notes;

	@NotNull
	@Builder.Default
	private List<@NotNull @Valid WorkoutSessionExerciseRequest> exercises = new ArrayList<>();
}
