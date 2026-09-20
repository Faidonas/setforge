package com.fazariadis.strengthcoach.controller;

import com.fazariadis.strengthcoach.dto.ExerciseResponse;
import com.fazariadis.strengthcoach.service.ExerciseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exercises")
@Tag(name = "Exercises", description = "Exercise catalogue operations")
@AllArgsConstructor
public class ExerciseController {

	private final ExerciseService exerciseService;

	@GetMapping
	@Operation(summary = "List all exercises", description = "Returns exercises ordered by name.")
	@ApiResponse(responseCode = "200", description = "Exercises returned successfully")
	public List<ExerciseResponse> getAllExercises() {
		return exerciseService.getAllExercises();
	}
}
