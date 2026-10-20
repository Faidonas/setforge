package com.fazariadis.strengthcoach.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCoachingRelationshipRequest {

	@NotBlank
	@Email
	private String clientEmail;

	@NotNull
	private Long coachId;
}
