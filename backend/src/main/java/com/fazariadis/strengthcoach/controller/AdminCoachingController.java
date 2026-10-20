package com.fazariadis.strengthcoach.controller;

import com.fazariadis.strengthcoach.dto.AdminCoachingRelationshipResponse;
import com.fazariadis.strengthcoach.dto.CreateCoachingRelationshipRequest;
import com.fazariadis.strengthcoach.dto.UserResponse;
import com.fazariadis.strengthcoach.service.AdminCoachingService;
import com.fazariadis.strengthcoach.service.AuthenticatedUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/coaching-relationships")
@Tag(name = "Administration", description = "Admin-only coaching relationship management")
@AllArgsConstructor
public class AdminCoachingController {

	private final AdminCoachingService adminCoachingService;
	private final AuthenticatedUserService authenticatedUserService;

	@GetMapping("/coaches")
	@Operation(summary = "List accounts that can coach clients")
	public List<UserResponse> getCoaches(@AuthenticationPrincipal Jwt jwt) {
		return adminCoachingService.getAssignableCoaches(authenticatedUserService.resolve(jwt));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Assign an individual to a coach")
	public AdminCoachingRelationshipResponse assignClient(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody CreateCoachingRelationshipRequest request) {
		return adminCoachingService.assignClient(authenticatedUserService.resolve(jwt), request);
	}
}
