package com.fazariadis.strengthcoach.controller;

import com.fazariadis.strengthcoach.dto.CoachClientDetailResponse;
import com.fazariadis.strengthcoach.dto.CoachClientSummaryResponse;
import com.fazariadis.strengthcoach.dto.CoachDashboardResponse;
import com.fazariadis.strengthcoach.dto.CoachWorkoutTemplateResponse;
import com.fazariadis.strengthcoach.dto.CreateWorkoutTemplateRequest;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateResponse;
import com.fazariadis.strengthcoach.service.AuthenticatedUserService;
import com.fazariadis.strengthcoach.service.CoachDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

	@GetMapping("/templates")
	@Operation(summary = "List the trainer's own templates and active-client templates")
	public List<CoachWorkoutTemplateResponse> getTemplates(@AuthenticationPrincipal Jwt jwt) {
		return coachDashboardService.getTemplates(authenticatedUserService.resolve(jwt));
	}

	@PostMapping("/templates")
	@Operation(summary = "Create an unassigned workout template in the trainer's library")
	public org.springframework.http.ResponseEntity<WorkoutTemplateResponse> createTemplate(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody CreateWorkoutTemplateRequest request) {
		WorkoutTemplateResponse response = coachDashboardService.createTemplate(
				authenticatedUserService.resolve(jwt), request);
		return org.springframework.http.ResponseEntity
				.created(URI.create("/api/workout-templates/" + response.getId()))
				.body(response);
	}

	@PostMapping("/templates/{templateId}/duplicate")
	@Operation(summary = "Duplicate a workout template in the trainer's library")
	public org.springframework.http.ResponseEntity<WorkoutTemplateResponse> duplicateTemplate(
			@PathVariable Long templateId,
			@AuthenticationPrincipal Jwt jwt) {
		WorkoutTemplateResponse response = coachDashboardService.duplicateTemplate(
				authenticatedUserService.resolve(jwt), templateId);
		return org.springframework.http.ResponseEntity
				.created(URI.create("/api/workout-templates/" + response.getId()))
				.body(response);
	}

	@PostMapping("/templates/{templateId}/assignments/{userId}")
	@Operation(summary = "Assign a library template to the trainer or an active client")
	public org.springframework.http.ResponseEntity<Void> assignTemplate(
			@PathVariable Long templateId,
			@PathVariable Long userId,
			@AuthenticationPrincipal Jwt jwt) {
		coachDashboardService.assignTemplate(authenticatedUserService.resolve(jwt), templateId, userId);
		return org.springframework.http.ResponseEntity.noContent().build();
	}

	@DeleteMapping("/templates/{templateId}/assignments/{userId}")
	@Operation(summary = "Remove a template assignment")
	public org.springframework.http.ResponseEntity<Void> unassignTemplate(
			@PathVariable Long templateId,
			@PathVariable Long userId,
			@AuthenticationPrincipal Jwt jwt) {
		coachDashboardService.unassignTemplate(authenticatedUserService.resolve(jwt), templateId, userId);
		return org.springframework.http.ResponseEntity.noContent().build();
	}
}
