package com.fazariadis.strengthcoach.mapper;

import com.fazariadis.strengthcoach.dto.UserResponse;
import com.fazariadis.strengthcoach.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

	public UserResponse toResponse(User user) {
		return UserResponse.builder()
				.id(user.getId())
				.email(user.getEmail())
				.displayName(user.getDisplayName())
				.accountType(user.getAccountType())
				.onboardingCompleted(user.isOnboardingCompleted())
				.unitSystem(user.getUnitSystem())
				.primaryObjective(user.getPrimaryObjective())
				.liftingExperience(user.getLiftingExperience())
				.themePreference(user.getThemePreference())
				.createdAt(user.getCreatedAt())
				.build();
	}
}
