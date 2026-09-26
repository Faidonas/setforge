package com.fazariadis.strengthcoach.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fazariadis.strengthcoach.dto.CreateWorkoutTemplateRequest;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateExerciseResponse;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateResponse;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateSetResponse;
import com.fazariadis.strengthcoach.entity.enums.ExerciseType;
import com.fazariadis.strengthcoach.entity.enums.SetType;
import com.fazariadis.strengthcoach.exception.ApiExceptionHandler;
import com.fazariadis.strengthcoach.service.WorkoutTemplateService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class WorkoutTemplateControllerTests {

	private final WorkoutTemplateService workoutTemplateService = mock(WorkoutTemplateService.class);
	private final MockMvc mockMvc = MockMvcBuilders
			.standaloneSetup(new WorkoutTemplateController(workoutTemplateService))
			.setControllerAdvice(new ApiExceptionHandler())
			.build();

	@Test
	void createsTemplateAndReturnsItsLocation() throws Exception {
		when(workoutTemplateService.create(any(CreateWorkoutTemplateRequest.class)))
				.thenReturn(WorkoutTemplateResponse.builder()
						.id(12L)
						.ownerId(1L)
						.name("Upper Body")
						.exercises(List.of())
						.build());

		mockMvc.perform(post("/api/workout-templates")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{
							  "ownerId": 1,
							  "name": "Upper Body",
							  "exercises": []
							}
							"""))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", "/api/workout-templates/12"))
				.andExpect(jsonPath("$.id").value(12))
				.andExpect(jsonPath("$.ownerId").value(1))
				.andExpect(jsonPath("$.name").value("Upper Body"));
	}

	@Test
	void rejectsInvalidNestedTargets() throws Exception {
		mockMvc.perform(post("/api/workout-templates")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{
							  "ownerId": 1,
							  "name": " ",
							  "exercises": [{
							    "exerciseId": 2,
							    "sets": [{"setType": "NORMAL", "targetReps": -1}]
							  }]
							}
							"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Request validation failed"))
				.andExpect(jsonPath("$.validationErrors.name").exists())
				.andExpect(jsonPath("$.validationErrors['exercises[0].sets[0].targetReps']").exists());
	}

	@Test
	void listsTemplatesForOwner() throws Exception {
		when(workoutTemplateService.getByOwner(1L)).thenReturn(List.of(
				WorkoutTemplateResponse.builder().id(12L).ownerId(1L).name("Upper Body").build()));

		mockMvc.perform(get("/api/workout-templates").param("ownerId", "1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(12))
				.andExpect(jsonPath("$[0].name").value("Upper Body"));
	}

	@Test
	void omitsTargetsThatDoNotApplyToExerciseType() throws Exception {
		WorkoutTemplateSetResponse weightSet = WorkoutTemplateSetResponse.builder()
				.id(201L)
				.position(0)
				.setType(SetType.NORMAL)
				.targetReps(8)
				.targetWeight(new java.math.BigDecimal("60.00"))
				.restSeconds(90)
				.build();
		WorkoutTemplateSetResponse timedSet = WorkoutTemplateSetResponse.builder()
				.id(202L)
				.position(0)
				.setType(SetType.NORMAL)
				.targetTimeSeconds(45)
				.restSeconds(30)
				.build();
		when(workoutTemplateService.getById(12L)).thenReturn(WorkoutTemplateResponse.builder()
				.id(12L)
				.ownerId(1L)
				.name("Full Body")
				.exercises(List.of(
						WorkoutTemplateExerciseResponse.builder()
								.exerciseType(ExerciseType.WEIGHT_AND_REPS)
								.sets(List.of(weightSet))
								.build(),
						WorkoutTemplateExerciseResponse.builder()
								.exerciseType(ExerciseType.TIMED)
								.sets(List.of(timedSet))
								.build()))
				.build());

		mockMvc.perform(get("/api/workout-templates/12"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.exercises[0].sets[0].targetReps").value(8))
				.andExpect(jsonPath("$.exercises[0].sets[0].targetWeight").value(60.0))
				.andExpect(jsonPath("$.exercises[0].sets[0].targetTimeSeconds").doesNotExist())
				.andExpect(jsonPath("$.exercises[1].sets[0].targetTimeSeconds").value(45))
				.andExpect(jsonPath("$.exercises[1].sets[0].targetReps").doesNotExist())
				.andExpect(jsonPath("$.exercises[1].sets[0].targetWeight").doesNotExist());
	}

	@Test
	void deletesTemplate() throws Exception {
		mockMvc.perform(delete("/api/workout-templates/12"))
				.andExpect(status().isNoContent());

		verify(workoutTemplateService).delete(12L);
	}
}
