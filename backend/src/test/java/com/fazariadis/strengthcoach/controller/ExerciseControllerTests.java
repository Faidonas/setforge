package com.fazariadis.strengthcoach.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fazariadis.strengthcoach.dto.ExerciseResponse;
import com.fazariadis.strengthcoach.entity.enums.ExerciseType;
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
				ExerciseResponse.builder()
						.id(1L)
						.name("Bench Press")
						.primaryMuscle("Chest")
						.equipment("Barbell")
						.exerciseType(ExerciseType.WEIGHT_AND_REPS)
						.instructions("Press the bar.")
						.bodyPart("chest")
						.thumbnailUrl("/exercise-media/images/0025-example.jpg")
						.animationUrl("/exercise-media/gifs/0025-example.gif")
						.attribution("© Gym visual — https://gymvisual.com/")
						.build()));

		mockMvc.perform(get("/api/exercises"))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$[0].id").value(1))
				.andExpect(jsonPath("$[0].name").value("Bench Press"))
				.andExpect(jsonPath("$[0].primaryMuscle").value("Chest"))
				.andExpect(jsonPath("$[0].equipment").value("Barbell"))
				.andExpect(jsonPath("$[0].exerciseType").value("WEIGHT_AND_REPS"))
				.andExpect(jsonPath("$[0].instructions").value("Press the bar."))
				.andExpect(jsonPath("$[0].bodyPart").value("chest"))
				.andExpect(jsonPath("$[0].thumbnailUrl")
						.value("/exercise-media/images/0025-example.jpg"))
				.andExpect(jsonPath("$[0].animationUrl")
						.value("/exercise-media/gifs/0025-example.gif"))
				.andExpect(jsonPath("$[0].attribution")
						.value("© Gym visual — https://gymvisual.com/"));
	}

	@Test
	void getExerciseReturnsOneResponseDto() throws Exception {
		when(exerciseService.getExercise(7L)).thenReturn(ExerciseResponse.builder()
				.id(7L)
				.name("Plank")
				.primaryMuscle("Abs")
				.equipment("Body weight")
				.exerciseType(ExerciseType.TIMED)
				.animationUrl("/exercise-media/gifs/plank.gif")
				.build());

		mockMvc.perform(get("/api/exercises/7"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(7))
				.andExpect(jsonPath("$.name").value("Plank"))
				.andExpect(jsonPath("$.exerciseType").value("TIMED"))
				.andExpect(jsonPath("$.animationUrl")
						.value("/exercise-media/gifs/plank.gif"));
	}
}
