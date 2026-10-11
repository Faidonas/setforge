package com.fazariadis.strengthcoach.controller;

import com.fazariadis.strengthcoach.dto.CreateCoachUserRequest;
import com.fazariadis.strengthcoach.dto.CreateCoachUserResponse;
import com.fazariadis.strengthcoach.service.AuthenticatedUserService;
import com.fazariadis.strengthcoach.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "Administration", description = "Admin-only user management")
@AllArgsConstructor
public class AdminUserController {

	private final UserService userService;
	private final AuthenticatedUserService authenticatedUserService;

	@PostMapping("/coaches")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create or promote a coach account")
	public CreateCoachUserResponse createCoach(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody CreateCoachUserRequest request) {
		return userService.createCoach(
				authenticatedUserService.resolve(jwt),
				request.getEmail(),
				request.getDisplayName(),
				request.getTemporaryPassword());
	}
}
