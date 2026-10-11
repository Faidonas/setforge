package com.fazariadis.strengthcoach.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCoachUserResponse {

	private UserResponse coach;
	private boolean supabaseUserCreated;
}
