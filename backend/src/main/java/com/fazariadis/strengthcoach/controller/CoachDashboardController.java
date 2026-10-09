package com.fazariadis.strengthcoach.controller;

import com.fazariadis.strengthcoach.dto.CoachClientDetailResponse;
import com.fazariadis.strengthcoach.dto.CoachClientSummaryResponse;
import com.fazariadis.strengthcoach.dto.CoachDashboardResponse;
import com.fazariadis.strengthcoach.service.AuthenticatedUserService;
import com.fazariadis.strengthcoach.service.CoachDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coach")
@Tag(name = "Coach Dashboard", description = "Trainer dashboard and active-client reporting")
@AllArgsConstructor
public class CoachDashboardController {

	private final CoachDashboardService coachDashboardService;
	private final AuthenticatedUserService authenticatedUserService;

	@GetMapping("/dashboard")
	@Operation(summary = "Get the authenticated trainer's dashboard")
	public CoachDashboardResponse getDashboard(@AuthenticationPrincipal Jwt jwt) {
		return coachDashboardService.getDashboard(authenticatedUserService.resolve(jwt));
	}

	@GetMapping("/clients")
	@Operation(summary = "List the authenticated trainer's active clients")
	public List<CoachClientSummaryResponse> getClients(@AuthenticationPrincipal Jwt jwt) {
		return coachDashboardService.getClients(authenticatedUserService.resolve(jwt));
	}

	@GetMapping("/clients/{clientId}")
	@Operation(summary = "Get performance details for an active client")
	public CoachClientDetailResponse getClient(
			@PathVariable Long clientId, @AuthenticationPrincipal Jwt jwt) {
		return coachDashboardService.getClient(authenticatedUserService.resolve(jwt), clientId);
	}
}
