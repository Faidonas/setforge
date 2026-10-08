package com.fazariadis.strengthcoach.controller;

import com.fazariadis.strengthcoach.dto.CompleteWorkoutSessionRequest;
import com.fazariadis.strengthcoach.dto.PreviousExercisePerformanceResponse;
import com.fazariadis.strengthcoach.dto.StartWorkoutSessionRequest;
import com.fazariadis.strengthcoach.dto.UpdateWorkoutSessionRequest;
import com.fazariadis.strengthcoach.dto.WorkoutSessionResponse;
import com.fazariadis.strengthcoach.service.WorkoutSessionService;
import com.fazariadis.strengthcoach.service.AuthenticatedUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@RequestMapping("/api/workout-sessions")
@Tag(name = "Workout Sessions", description = "Live workout execution and history operations")
@AllArgsConstructor
public class WorkoutSessionController {

	private final WorkoutSessionService workoutSessionService;
	private final AuthenticatedUserService authenticatedUserService;

	@PostMapping
	@Operation(summary = "Start an empty workout or a workout from a template")
	@ApiResponse(responseCode = "201", description = "Workout started")
	@ApiResponse(responseCode = "404", description = "User or template was not found")
	public ResponseEntity<WorkoutSessionResponse> start(
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody StartWorkoutSessionRequest request) {
		request.setUserId(authenticatedUserService.resolve(jwt).getId());
		WorkoutSessionResponse response = workoutSessionService.start(request);
		return ResponseEntity.created(URI.create("/api/workout-sessions/" + response.getId()))
				.body(response);
	}

	@GetMapping("/{sessionId}")
	@Operation(summary = "Get a workout session")
	public WorkoutSessionResponse getById(@PathVariable Long sessionId, @AuthenticationPrincipal Jwt jwt) {
		return workoutSessionService.getById(sessionId, authenticatedUserService.resolve(jwt).getId());
	}

	@GetMapping("/active")
	@Operation(summary = "Get a user's active workout, if one exists")
	@ApiResponse(responseCode = "200", description = "Active workout returned")
	@ApiResponse(responseCode = "204", description = "The user has no active workout")
	public ResponseEntity<WorkoutSessionResponse> getActive(@AuthenticationPrincipal Jwt jwt) {
		Long userId = authenticatedUserService.resolve(jwt).getId();
		return ResponseEntity.ofNullable(workoutSessionService.getActive(userId));
	}

	@GetMapping
	@Operation(summary = "List a user's completed workout history")
	public List<WorkoutSessionResponse> getCompletedHistory(@AuthenticationPrincipal Jwt jwt) {
		Long userId = authenticatedUserService.resolve(jwt).getId();
		return workoutSessionService.getCompletedHistory(userId);
	}

	@GetMapping("/previous-performances")
	@Operation(summary = "Get the latest completed sets for exercises")
	public List<PreviousExercisePerformanceResponse> getPreviousPerformances(
			@AuthenticationPrincipal Jwt jwt,
			@Parameter(description = "Exercise identifiers", example = "1,2,3")
			@RequestParam List<Long> exerciseIds) {
		return workoutSessionService.getPreviousPerformances(authenticatedUserService.resolve(jwt).getId(), exerciseIds);
	}

	@PostMapping("/{sessionId}/complete")
	@Operation(
			summary = "Complete and save a workout",
			description = "Saves the final exercise plan and completed set results. "
					+ "Unfinished sets are retained as incomplete.")
	public WorkoutSessionResponse complete(
			@PathVariable Long sessionId,
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody CompleteWorkoutSessionRequest request) {
		return workoutSessionService.complete(sessionId, authenticatedUserService.resolve(jwt).getId(), request);
	}

	@PostMapping("/{sessionId}/cancel")
	@Operation(summary = "Cancel and permanently discard an active workout")
	@ApiResponse(responseCode = "204", description = "Workout discarded")
	public ResponseEntity<Void> cancel(@PathVariable Long sessionId, @AuthenticationPrincipal Jwt jwt) {
		workoutSessionService.cancel(sessionId, authenticatedUserService.resolve(jwt).getId());
		return ResponseEntity.noContent().build();
	}

	@PutMapping("/{sessionId}")
	@Operation(summary = "Edit a completed workout")
	public WorkoutSessionResponse updateCompleted(
			@PathVariable Long sessionId,
			@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody UpdateWorkoutSessionRequest request) {
		return workoutSessionService.updateCompleted(sessionId, authenticatedUserService.resolve(jwt).getId(), request);
	}

	@DeleteMapping("/{sessionId}")
	@Operation(summary = "Delete a saved workout")
	public ResponseEntity<Void> deleteCompleted(@PathVariable Long sessionId, @AuthenticationPrincipal Jwt jwt) {
		workoutSessionService.deleteCompleted(sessionId, authenticatedUserService.resolve(jwt).getId());
		return ResponseEntity.noContent().build();
	}
}
