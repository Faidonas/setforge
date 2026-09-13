package com.fazariadis.strengthcoach.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fazariadis.strengthcoach.dto.ExerciseResponse;
import com.fazariadis.strengthcoach.service.ExerciseService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ExerciseControllerTests {

	private final ExerciseService exerciseService = mock(ExerciseService.class);
	private final MockMvc mockMvc =
			MockMvcBuilders.standaloneSetup(new ExerciseController(exerciseService)).build();

	@Test
	void getExercisesReturnsResponseDtos() throws Exception {
		when(exerciseService.getAllExercises()).thenReturn(List.of(
				new ExerciseResponse(1L, "Bench Press", "Chest", "Barbell", "Press the bar.")));

		mockMvc.perform(get("/api/exercises"))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$[0].id").value(1))
				.andExpect(jsonPath("$[0].name").value("Bench Press"))
				.andExpect(jsonPath("$[0].primaryMuscle").value("Chest"))
				.andExpect(jsonPath("$[0].equipment").value("Barbell"))
				.andExpect(jsonPath("$[0].instructions").value("Press the bar."));
	}
}
