package com.fazariadis.strengthcoach.dto;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreviousExercisePerformanceResponse {

	private Long exerciseId;
	private Long workoutSessionId;
	private Instant performedAt;
	private List<PreviousExerciseSetResponse> sets;
}
