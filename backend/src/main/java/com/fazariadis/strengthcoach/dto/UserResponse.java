package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.entity.enums.LiftingExperience;
import com.fazariadis.strengthcoach.entity.enums.PrimaryObjective;
import com.fazariadis.strengthcoach.entity.enums.ThemePreference;
import com.fazariadis.strengthcoach.entity.enums.UnitSystem;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "A SetForge user profile")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

	@Schema(description = "User identifier", example = "1")
	private Long id;

	@Schema(description = "Email address", example = "alex.trainer@setforge.dev")
	private String email;

	@Schema(description = "Name displayed in SetForge", example = "Alex Trainer")
	private String displayName;

	@Schema(description = "User role", example = "PERSONAL_TRAINER")
	private AccountType accountType;

	@Schema(description = "Whether the initial workspace selection has been completed")
	private boolean onboardingCompleted;

	@Schema(description = "Preferred weight unit system", example = "METRIC")
	private UnitSystem unitSystem;

	@Schema(description = "Primary training objective", example = "STRENGTH")
	private PrimaryObjective primaryObjective;

	@Schema(description = "Self-reported lifting experience", example = "INTERMEDIATE")
	private LiftingExperience liftingExperience;

	@Schema(description = "Preferred application color theme", example = "DARK")
	private ThemePreference themePreference;

	@Schema(description = "Date the account was created")
	private Instant createdAt;
}
