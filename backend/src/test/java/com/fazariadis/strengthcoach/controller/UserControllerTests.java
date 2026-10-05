package com.fazariadis.strengthcoach.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fazariadis.strengthcoach.dto.UserResponse;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.service.UserService;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class UserControllerTests {

	private final UserService userService = mock(UserService.class);
	private final MockMvc mockMvc =
			MockMvcBuilders.standaloneSetup(new UserController(userService)).build();

	@Test
	void getUserReturnsProfile() throws Exception {
		when(userService.getUser(1L)).thenReturn(UserResponse.builder()
				.id(1L)
				.email("alex.trainer@setforge.dev")
				.displayName("Alex Trainer")
				.accountType(AccountType.PERSONAL_TRAINER)
				.createdAt(Instant.parse("2026-09-01T10:00:00Z"))
				.build());

		mockMvc.perform(get("/api/users/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(1))
				.andExpect(jsonPath("$.email").value("alex.trainer@setforge.dev"))
				.andExpect(jsonPath("$.displayName").value("Alex Trainer"))
				.andExpect(jsonPath("$.accountType").value("PERSONAL_TRAINER"));
	}
}
