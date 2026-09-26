package com.fazariadis.strengthcoach.dto;

import java.time.Instant;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiErrorResponse {

	private Instant timestamp;
	private int status;
	private String error;
	private String message;
	private String path;
	private Map<String, String> validationErrors;
}
