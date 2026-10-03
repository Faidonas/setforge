package com.fazariadis.strengthcoach.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutSessionExerciseRequest {

	private Long id;

	@NotNull
	private Long exerciseId;

	private String notes;

	@NotNull
	@Builder.Default
	private List<@NotNull @Valid WorkoutSetRequest> sets = new ArrayList<>();
}
