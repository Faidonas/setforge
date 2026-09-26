package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.ExerciseType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "An ordered exercise in a workout template")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutTemplateExerciseResponse {

	private Long id;
	private Long exerciseId;
	private String exerciseName;
	private String primaryMuscle;
	private String equipment;
	private ExerciseType exerciseType;
	private Integer position;
	private String notes;
	private List<WorkoutTemplateSetResponse> sets;
}
