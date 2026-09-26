package com.fazariadis.strengthcoach.controller;

import com.fazariadis.strengthcoach.dto.CreateWorkoutTemplateRequest;
import com.fazariadis.strengthcoach.dto.UpdateWorkoutTemplateRequest;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateResponse;
import com.fazariadis.strengthcoach.service.WorkoutTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.net.URI;
import java.util.List;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workout-templates")
@Tag(name = "Workout Templates", description = "Reusable workout planning operations")
@AllArgsConstructor
public class WorkoutTemplateController {

    private final WorkoutTemplateService workoutTemplateService;

    @PostMapping
    @Operation(summary = "Create a workout template")
    @ApiResponse(responseCode = "201", description = "Workout template created")
    @ApiResponse(responseCode = "400", description = "Request validation failed")
    @ApiResponse(responseCode = "404", description = "Owner or exercise was not found")
    public ResponseEntity<WorkoutTemplateResponse> create(
            @Valid @RequestBody CreateWorkoutTemplateRequest request) {
        WorkoutTemplateResponse response = workoutTemplateService.create(request);
        return ResponseEntity.created(URI.create("/api/workout-templates/" + response.getId()))
                .body(response);
    }

    @PutMapping("/{templateId}")
    @Operation(
            summary = "Update a workout template",
            description = "Replaces the template name, description, exercises, and planned sets.")
    @ApiResponse(responseCode = "200", description = "Workout template updated")
    @ApiResponse(responseCode = "400", description = "Request validation failed")
    @ApiResponse(responseCode = "404", description = "Template or exercise was not found")
    public WorkoutTemplateResponse update(
            @PathVariable Long templateId,
            @Valid @RequestBody UpdateWorkoutTemplateRequest request) {
        return workoutTemplateService.update(templateId, request);
    }

    @GetMapping("/{templateId}")
    @Operation(summary = "Get one workout template")
    @ApiResponse(responseCode = "200", description = "Workout template returned")
    @ApiResponse(responseCode = "404", description = "Workout template was not found")
    public WorkoutTemplateResponse getById(@PathVariable Long templateId) {
        return workoutTemplateService.getById(templateId);
    }

    @DeleteMapping("/{templateId}")
    @Operation(
            summary = "Delete a workout template",
            description = "Deletes the template and its planned exercises and sets.")
    @ApiResponse(responseCode = "204", description = "Workout template deleted")
    @ApiResponse(responseCode = "404", description = "Workout template was not found")
    public ResponseEntity<Void> delete(@PathVariable Long templateId) {
        workoutTemplateService.delete(templateId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(summary = "List a user's workout templates")
    @ApiResponse(responseCode = "200", description = "Workout templates returned newest first")
    @ApiResponse(responseCode = "404", description = "User was not found")
    public List<WorkoutTemplateResponse> getByOwner(
            @Parameter(description = "Template owner identifier", example = "1")
            @RequestParam Long ownerId) {
        return workoutTemplateService.getByOwner(ownerId);
    }
}
