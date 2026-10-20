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
public class AdminCoachingRelationshipResponse {

	private Long relationshipId;
	private Long coachId;
	private String coachName;
	private Long clientId;
	private String clientName;
	private String clientEmail;
	private CoachingStatus status;
	private Instant startedAt;
}
