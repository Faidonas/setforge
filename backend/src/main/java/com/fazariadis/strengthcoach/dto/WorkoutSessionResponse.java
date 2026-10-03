package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.WorkoutSessionStatus;
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
public class WorkoutSessionResponse {

	private Long id;
	private Long userId;
	private Long sourceTemplateId;
	private String name;
	private String notes;
	private WorkoutSessionStatus status;
	private Instant startedAt;
	private Instant completedAt;
	private List<WorkoutSessionExerciseResponse> exercises;
}
