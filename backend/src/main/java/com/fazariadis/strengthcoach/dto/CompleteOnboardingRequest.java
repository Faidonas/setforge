package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.LiftingExperience;
import com.fazariadis.strengthcoach.entity.enums.PrimaryObjective;
import com.fazariadis.strengthcoach.entity.enums.UnitSystem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompleteOnboardingRequest {

	@NotBlank
	@Size(max = 100)
	private String displayName;

	@NotNull
	private UnitSystem unitSystem;

	@NotNull
	private PrimaryObjective primaryObjective;

	@NotNull
	private LiftingExperience liftingExperience;
}
