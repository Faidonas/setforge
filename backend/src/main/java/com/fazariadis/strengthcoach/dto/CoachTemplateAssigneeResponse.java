package com.fazariadis.strengthcoach.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachTemplateAssigneeResponse {
	private Long userId;
	private String displayName;
	private String email;
	private Instant assignedAt;
}
