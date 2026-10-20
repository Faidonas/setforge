package com.fazariadis.strengthcoach.dto;

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
public class CoachWorkoutTemplateResponse {
	private WorkoutTemplateResponse template;
	@Builder.Default
	private List<CoachTemplateAssigneeResponse> assignees = new ArrayList<>();
}
