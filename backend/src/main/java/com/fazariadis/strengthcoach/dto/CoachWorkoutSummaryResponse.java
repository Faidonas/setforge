package com.fazariadis.strengthcoach.dto;

import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachWorkoutSummaryResponse {

	private Long id;
	private Long clientId;
	private String clientName;
	private String name;
	private Instant startedAt;
	private Instant completedAt;
	private Long durationMinutes;
	private BigDecimal totalVolume;
}
