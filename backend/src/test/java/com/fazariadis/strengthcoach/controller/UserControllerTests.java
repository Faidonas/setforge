package com.fazariadis.strengthcoach.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fazariadis.strengthcoach.dto.UserResponse;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.entity.enums.LiftingExperience;
import com.fazariadis.strengthcoach.entity.enums.PrimaryObjective;
import com.fazariadis.strengthcoach.entity.enums.ThemePreference;
import com.fazariadis.strengthcoach.entity.enums.UnitSystem;
import com.fazariadis.strengthcoach.service.UserService;
import com.fazariadis.strengthcoach.service.AuthenticatedUserService;
import com.fazariadis.strengthcoach.entity.User;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.http.MediaType;

class UserControllerTests {

	private final UserService userService = mock(UserService.class);
	private final AuthenticatedUserService authenticatedUserService = mock(AuthenticatedUserService.class);
	private final MockMvc mockMvc =
			MockMvcBuilders.standaloneSetup(new UserController(userService, authenticatedUserService))
					.setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();

	@Test
	void getUserReturnsProfile() throws Exception {
		when(authenticatedUserService.resolve(null)).thenReturn(User.builder().id(1L).build());
		when(userService.getUser(1L)).thenReturn(UserResponse.builder()
				.id(1L)
				.email("alex.trainer@spotterapp.gr")
				.displayName("Alex Trainer")
				.accountType(AccountType.PERSONAL_TRAINER)
				.onboardingCompleted(true)
				.createdAt(Instant.parse("2026-09-01T10:00:00Z"))
				.build());

		mockMvc.perform(get("/api/users/me"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(1))
				.andExpect(jsonPath("$.email").value("alex.trainer@spotterapp.gr"))
				.andExpect(jsonPath("$.displayName").value("Alex Trainer"))
				.andExpect(jsonPath("$.accountType").value("PERSONAL_TRAINER"))
				.andExpect(jsonPath("$.onboardingCompleted").value(true));
	}

	@Test
	void completeOnboardingUpdatesTheAuthenticatedProfile() throws Exception {
		when(authenticatedUserService.resolve(null)).thenReturn(User.builder().id(1L).build());
		when(userService.completeOnboarding(eq(1L), any())).thenReturn(UserResponse.builder()
				.id(1L)
				.displayName("Alex")
				.accountType(AccountType.INDIVIDUAL)
				.onboardingCompleted(true)
				.unitSystem(UnitSystem.METRIC)
				.primaryObjective(PrimaryObjective.STRENGTH)
				.liftingExperience(LiftingExperience.INTERMEDIATE)
				.build());

		mockMvc.perform(put("/api/users/me/onboarding")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"displayName":"Alex","unitSystem":"METRIC","primaryObjective":"STRENGTH","liftingExperience":"INTERMEDIATE"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.displayName").value("Alex"))
				.andExpect(jsonPath("$.onboardingCompleted").value(true));

		verify(userService).completeOnboarding(eq(1L), any());
	}

	@Test
	void updateThemePreferenceUpdatesTheAuthenticatedProfile() throws Exception {
		when(authenticatedUserService.resolve(null)).thenReturn(User.builder().id(1L).build());
		when(userService.updateThemePreference(1L, ThemePreference.LIGHT)).thenReturn(
				UserResponse.builder().id(1L).themePreference(ThemePreference.LIGHT).build());

		mockMvc.perform(put("/api/users/me/theme")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"themePreference\":\"LIGHT\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.themePreference").value("LIGHT"));

		verify(userService).updateThemePreference(1L, ThemePreference.LIGHT);
	}
}
