package com.fazariadis.strengthcoach.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fazariadis.strengthcoach.dto.ExerciseResponse;
import com.fazariadis.strengthcoach.entity.Exercise;
import com.fazariadis.strengthcoach.entity.enums.ExerciseType;
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
		ExerciseResponse benchPressResponse = ExerciseResponse.builder()
				.id(1L)
				.name("Bench Press")
				.primaryMuscle("Chest")
				.equipment("Barbell")
				.exerciseType(ExerciseType.WEIGHT_AND_REPS)
				.instructions("Press the bar.")
				.build();
		ExerciseResponse squatResponse = ExerciseResponse.builder()
				.id(2L)
				.name("Squat")
				.primaryMuscle("Quadriceps")
				.equipment("Barbell")
				.exerciseType(ExerciseType.WEIGHT_AND_REPS)
				.build();

		when(exerciseRepository.findAllByOrderByNameAsc()).thenReturn(List.of(benchPress, squat));
		when(benchPress.getId()).thenReturn(benchPressResponse.getId());
		when(benchPress.getName()).thenReturn(benchPressResponse.getName());
		when(benchPress.getPrimaryMuscle()).thenReturn(benchPressResponse.getPrimaryMuscle());
		when(benchPress.getEquipment()).thenReturn(benchPressResponse.getEquipment());
		when(benchPress.getExerciseType()).thenReturn(benchPressResponse.getExerciseType());
		when(benchPress.getInstructions()).thenReturn(benchPressResponse.getInstructions());
		when(squat.getId()).thenReturn(squatResponse.getId());
		when(squat.getName()).thenReturn(squatResponse.getName());
		when(squat.getPrimaryMuscle()).thenReturn(squatResponse.getPrimaryMuscle());
		when(squat.getEquipment()).thenReturn(squatResponse.getEquipment());
		when(squat.getExerciseType()).thenReturn(squatResponse.getExerciseType());
		when(squat.getInstructions()).thenReturn(squatResponse.getInstructions());

		List<ExerciseResponse> result = exerciseService.getAllExercises();

		assertThat(result).containsExactly(benchPressResponse, squatResponse);
		verify(exerciseRepository).findAllByOrderByNameAsc();
	}
}
