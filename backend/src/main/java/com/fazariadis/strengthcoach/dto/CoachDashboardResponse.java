package com.fazariadis.strengthcoach.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachDashboardResponse {

	private Long coachId;
	private String coachName;
	private long activeClientCount;
	private long templateCount;
	private long completedWorkoutsLast28Days;
	private long clientsNeedingAttention;
	private List<CoachClientSummaryResponse> attentionClients;
	private List<CoachWorkoutSummaryResponse> recentWorkouts;
}
