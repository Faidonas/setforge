package com.fazariadis.strengthcoach.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fazariadis.strengthcoach.dto.StartWorkoutSessionRequest;
import com.fazariadis.strengthcoach.dto.UpdateWorkoutSessionRequest;
import com.fazariadis.strengthcoach.dto.WorkoutSessionResponse;
import com.fazariadis.strengthcoach.exception.ApiExceptionHandler;
import com.fazariadis.strengthcoach.service.WorkoutSessionService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class WorkoutSessionControllerTests {

	private final WorkoutSessionService workoutSessionService = mock(WorkoutSessionService.class);
	private final MockMvc mockMvc = MockMvcBuilders
			.standaloneSetup(new WorkoutSessionController(workoutSessionService))
			.setControllerAdvice(new ApiExceptionHandler())
			.build();

	@Test
	void startsWorkoutFromCompletedSession() throws Exception {
		when(workoutSessionService.start(any(StartWorkoutSessionRequest.class)))
				.thenReturn(WorkoutSessionResponse.builder()
						.id(22L)
						.userId(1L)
						.name("Upper A")
						.exercises(List.of())
						.build());

		mockMvc.perform(post("/api/workout-sessions")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{
							  "userId": 1,
							  "sourceWorkoutSessionId": 12
							}
							"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value(22))
				.andExpect(jsonPath("$.name").value("Upper A"));
	}

	@Test
	void updatesCompletedWorkout() throws Exception {
		when(workoutSessionService.updateCompleted(
				org.mockito.ArgumentMatchers.eq(12L), any(UpdateWorkoutSessionRequest.class)))
				.thenReturn(WorkoutSessionResponse.builder()
						.id(12L)
						.name("Updated Upper A")
						.exercises(List.of())
						.build());

		mockMvc.perform(put("/api/workout-sessions/12")
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{
							  "name": "Updated Upper A",
							  "exercises": []
							}
							"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Updated Upper A"));
	}

	@Test
	void deletesSavedWorkout() throws Exception {
		mockMvc.perform(delete("/api/workout-sessions/12"))
				.andExpect(status().isNoContent());

		verify(workoutSessionService).deleteCompleted(12L);
	}
}
