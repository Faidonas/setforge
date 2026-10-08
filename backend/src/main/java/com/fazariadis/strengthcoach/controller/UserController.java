package com.fazariadis.strengthcoach.controller;

import com.fazariadis.strengthcoach.dto.UserResponse;
import com.fazariadis.strengthcoach.service.UserService;
import com.fazariadis.strengthcoach.service.AuthenticatedUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "User profile operations")
@AllArgsConstructor
public class UserController {

	private final UserService userService;
	private final AuthenticatedUserService authenticatedUserService;

	@GetMapping("/me")
	@Operation(summary = "Get a user profile", description = "Returns one SetForge user profile.")
	@ApiResponse(responseCode = "200", description = "User returned successfully")
	@ApiResponse(responseCode = "404", description = "User not found")
	public UserResponse getUser(@AuthenticationPrincipal Jwt jwt) {
		return userService.getUser(authenticatedUserService.resolve(jwt).getId());
	}
}
