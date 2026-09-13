package com.fazariadis.strengthcoach.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fazariadis.strengthcoach.dto.ExerciseResponse;
import com.fazariadis.strengthcoach.entity.Exercise;
import com.fazariadis.strengthcoach.mapper.ExerciseMapper;
import com.fazariadis.strengthcoach.repository.ExerciseRepository;
import java.util.List;
import org.junit.jupiter.api.Test;

class ExerciseServiceTests {

	private final ExerciseRepository exerciseRepository = mock(ExerciseRepository.class);
	private final ExerciseMapper exerciseMapper = new ExerciseMapper();
	private final ExerciseService exerciseService = new ExerciseService(exerciseRepository, exerciseMapper);

	@Test
	void returnsMappedExercisesFromNameOrderedQuery() {
		Exercise benchPress = mock(Exercise.class);
		Exercise squat = mock(Exercise.class);
		ExerciseResponse benchPressResponse =
				new ExerciseResponse(1L, "Bench Press", "Chest", "Barbell", "Press the bar.");
		ExerciseResponse squatResponse =
				new ExerciseResponse(2L, "Squat", "Quadriceps", "Barbell", null);

		when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(benchPress, squat));
		when(benchPress.getId()).thenReturn(benchPressResponse.id());
		when(benchPress.getName()).thenReturn(benchPressResponse.name());
		when(benchPress.getPrimaryMuscle()).thenReturn(benchPressResponse.primaryMuscle());
		when(benchPress.getEquipment()).thenReturn(benchPressResponse.equipment());
		when(benchPress.getInstructions()).thenReturn(benchPressResponse.instructions());
		when(squat.getId()).thenReturn(squatResponse.id());
		when(squat.getName()).thenReturn(squatResponse.name());
		when(squat.getPrimaryMuscle()).thenReturn(squatResponse.primaryMuscle());
		when(squat.getEquipment()).thenReturn(squatResponse.equipment());
		when(squat.getInstructions()).thenReturn(squatResponse.instructions());

		List<ExerciseResponse> result = exerciseService.getAllExercises();

		assertThat(result).containsExactly(benchPressResponse, squatResponse);
		verify(exerciseRepository).findAllByOrderByNameAsc();
	}
}
