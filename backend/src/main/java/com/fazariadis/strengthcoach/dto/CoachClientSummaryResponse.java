package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.CoachingStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachClientSummaryResponse {

	private Long id;
	private String displayName;
	private String email;
	private CoachingStatus relationshipStatus;
	private Instant coachingSince;
	private long completedWorkoutsLast28Days;
	private Instant lastWorkoutAt;
	private String lastWorkoutName;
}
