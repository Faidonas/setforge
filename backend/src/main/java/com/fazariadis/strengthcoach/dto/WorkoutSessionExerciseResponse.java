package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.ExerciseType;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutSessionExerciseResponse {

	private Long id;
	private Long exerciseId;
	private String exerciseName;
	private String primaryMuscle;
	private String equipment;
	private ExerciseType exerciseType;
	private String thumbnailUrl;
	private Integer position;
	private String notes;
	private List<WorkoutSetResponse> sets;
}
