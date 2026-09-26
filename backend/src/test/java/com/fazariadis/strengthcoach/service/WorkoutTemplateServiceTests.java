package com.fazariadis.strengthcoach.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fazariadis.strengthcoach.dto.CreateWorkoutTemplateRequest;
import com.fazariadis.strengthcoach.dto.UpdateWorkoutTemplateRequest;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateExerciseRequest;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateResponse;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateSetRequest;
import com.fazariadis.strengthcoach.entity.Exercise;
import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.WorkoutTemplate;
import com.fazariadis.strengthcoach.entity.WorkoutTemplateExercise;
import com.fazariadis.strengthcoach.entity.WorkoutTemplateSet;
import com.fazariadis.strengthcoach.entity.enums.ExerciseType;
import com.fazariadis.strengthcoach.entity.enums.SetType;
import com.fazariadis.strengthcoach.exception.InvalidRequestException;
import com.fazariadis.strengthcoach.exception.ResourceNotFoundException;
import com.fazariadis.strengthcoach.mapper.WorkoutTemplateMapper;
import com.fazariadis.strengthcoach.repository.ExerciseRepository;
import com.fazariadis.strengthcoach.repository.UserRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateExerciseRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateSetRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;

class WorkoutTemplateServiceTests {

	private final WorkoutTemplateRepository templateRepository = mock(WorkoutTemplateRepository.class);
	private final WorkoutTemplateExerciseRepository templateExerciseRepository =
			mock(WorkoutTemplateExerciseRepository.class);
	private final WorkoutTemplateSetRepository templateSetRepository =
			mock(WorkoutTemplateSetRepository.class);
	private final UserRepository userRepository = mock(UserRepository.class);
	private final ExerciseRepository exerciseRepository = mock(ExerciseRepository.class);
	private final WorkoutTemplateService service = new WorkoutTemplateService(
			templateRepository,
			templateExerciseRepository,
			templateSetRepository,
			userRepository,
			exerciseRepository,
			new WorkoutTemplateMapper());

	@Test
	void createsOrderedExerciseAndSetPlan() {
		User owner = User.builder().id(1L).build();
		Exercise squat = Exercise.builder()
				.id(10L)
				.name("Back Squat")
				.primaryMuscle("Quadriceps")
				.equipment("Barbell")
				.build();
		Exercise bench = Exercise.builder()
				.id(11L)
				.name("Bench Press")
				.primaryMuscle("Chest")
				.equipment("Barbell")
				.build();
		Exercise plank = Exercise.builder()
				.id(12L)
				.name("Plank")
				.primaryMuscle("Core")
				.equipment("Bodyweight")
				.exerciseType(ExerciseType.TIMED)
				.build();
		List<WorkoutTemplateExercise> savedExercises = new ArrayList<>();
		List<WorkoutTemplateSet> savedSets = new ArrayList<>();
		AtomicLong exerciseSequence = new AtomicLong(100);
		AtomicLong setSequence = new AtomicLong(200);

		when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
		when(exerciseRepository.findAllById(org.mockito.ArgumentMatchers.<Iterable<Long>>any()))
				.thenReturn(List.of(squat, bench, plank));
		when(templateRepository.saveAndFlush(any(WorkoutTemplate.class))).thenAnswer(invocation -> {
			WorkoutTemplate template = invocation.getArgument(0);
			template.setId(50L);
			return template;
		});
		when(templateExerciseRepository.save(any(WorkoutTemplateExercise.class)))
				.thenAnswer(invocation -> {
					WorkoutTemplateExercise templateExercise = invocation.getArgument(0);
					templateExercise.setId(exerciseSequence.getAndIncrement());
					savedExercises.add(templateExercise);
					return templateExercise;
				});
		when(templateSetRepository.saveAll(
				org.mockito.ArgumentMatchers.<Iterable<WorkoutTemplateSet>>any()))
				.thenAnswer(invocation -> {
					Iterable<WorkoutTemplateSet> sets = invocation.getArgument(0);
					sets.forEach(set -> {
						set.setId(setSequence.getAndIncrement());
						savedSets.add(set);
					});
					return savedSets;
				});
		when(templateExerciseRepository.findAllByWorkoutTemplate_IdOrderByPositionAsc(50L))
				.thenAnswer(invocation -> savedExercises);
		when(templateSetRepository
				.findAllByTemplateExercise_IdInOrderByTemplateExercise_IdAscPositionAsc(
						org.mockito.ArgumentMatchers.<Collection<Long>>any()))
				.thenAnswer(invocation -> savedSets);

		CreateWorkoutTemplateRequest request = CreateWorkoutTemplateRequest.builder()
				.ownerId(1L)
				.name(" Full Body ")
				.exercises(List.of(
						WorkoutTemplateExerciseRequest.builder()
								.exerciseId(10L)
								.sets(List.of(
										WorkoutTemplateSetRequest.builder()
												.setType(SetType.WARM_UP)
												.targetReps(10)
												.build(),
										WorkoutTemplateSetRequest.builder()
												.targetReps(5)
												.targetWeight(new BigDecimal("80.00"))
												.restSeconds(90)
												.build()))
								.build(),
						WorkoutTemplateExerciseRequest.builder()
								.exerciseId(11L)
								.sets(List.of())
								.build(),
						WorkoutTemplateExerciseRequest.builder()
								.exerciseId(12L)
								.sets(List.of(WorkoutTemplateSetRequest.builder()
										.targetTimeSeconds(45)
										.restSeconds(30)
										.build()))
								.build()))
				.build();

		WorkoutTemplateResponse response = service.create(request);

		assertThat(response.getName()).isEqualTo("Full Body");
		assertThat(response.getExercises()).extracting("position").containsExactly(0, 1, 2);
		assertThat(response.getExercises().getFirst().getSets())
				.extracting("position")
				.containsExactly(0, 1);
		assertThat(response.getExercises().getFirst().getSets().get(1).getTargetWeight())
				.isEqualByComparingTo("80.00");
		assertThat(response.getExercises().getFirst().getSets().get(1).getRestSeconds()).isEqualTo(90);
		assertThat(response.getExercises().get(2).getExerciseType()).isEqualTo(ExerciseType.TIMED);
		assertThat(response.getExercises().get(2).getSets().getFirst().getTargetTimeSeconds())
				.isEqualTo(45);
	}

	@Test
	void rejectsMissingExerciseBeforeSavingTemplate() {
		when(userRepository.findById(1L)).thenReturn(Optional.of(User.builder().id(1L).build()));
		when(exerciseRepository.findAllById(org.mockito.ArgumentMatchers.<Iterable<Long>>any()))
				.thenReturn(List.of());
		CreateWorkoutTemplateRequest request = CreateWorkoutTemplateRequest.builder()
				.ownerId(1L)
				.name("Full Body")
				.exercises(List.of(WorkoutTemplateExerciseRequest.builder()
						.exerciseId(999L)
						.build()))
				.build();

		assertThatThrownBy(() -> service.create(request))
				.isInstanceOf(ResourceNotFoundException.class)
				.hasMessage("Exercise 999 was not found");
		verify(templateRepository, never()).saveAndFlush(any(WorkoutTemplate.class));
	}

	@Test
	void rejectsRepsAndWeightForTimedExercise() {
		Exercise plank = Exercise.builder()
				.id(12L)
				.name("Plank")
				.exerciseType(ExerciseType.TIMED)
				.build();
		when(userRepository.findById(1L)).thenReturn(Optional.of(User.builder().id(1L).build()));
		when(exerciseRepository.findAllById(org.mockito.ArgumentMatchers.<Iterable<Long>>any()))
				.thenReturn(List.of(plank));
		CreateWorkoutTemplateRequest request = CreateWorkoutTemplateRequest.builder()
				.ownerId(1L)
				.name("Timed Core")
				.exercises(List.of(WorkoutTemplateExerciseRequest.builder()
						.exerciseId(12L)
						.sets(List.of(WorkoutTemplateSetRequest.builder()
								.targetReps(10)
								.targetTimeSeconds(45)
								.build()))
						.build()))
				.build();

		assertThatThrownBy(() -> service.create(request))
				.isInstanceOf(InvalidRequestException.class)
				.hasMessage("Timed exercise 'Plank' accepts only targetTimeSeconds");
		verify(templateRepository, never()).saveAndFlush(any(WorkoutTemplate.class));
	}

	@Test
	void updateReplacesExistingExerciseAndSetPlan() {
		WorkoutTemplate template = WorkoutTemplate.builder()
				.id(50L)
				.owner(User.builder().id(1L).build())
				.name("Old Plan")
				.build();
		WorkoutTemplateExercise oldExercise = WorkoutTemplateExercise.builder()
				.id(100L)
				.workoutTemplate(template)
				.exercise(Exercise.builder().id(10L).build())
				.position(0)
				.build();
		WorkoutTemplateSet oldSet = WorkoutTemplateSet.builder()
				.id(200L)
				.templateExercise(oldExercise)
				.position(0)
				.build();

		when(templateRepository.findById(50L)).thenReturn(Optional.of(template));
		when(templateRepository.saveAndFlush(template)).thenReturn(template);
		when(exerciseRepository.findAllById(org.mockito.ArgumentMatchers.<Iterable<Long>>any()))
				.thenReturn(List.of());
		when(templateExerciseRepository.findAllByWorkoutTemplate_IdOrderByPositionAsc(50L))
				.thenReturn(List.of(oldExercise), List.of());
		when(templateSetRepository
				.findAllByTemplateExercise_IdInOrderByTemplateExercise_IdAscPositionAsc(
						org.mockito.ArgumentMatchers.<Collection<Long>>any()))
				.thenReturn(List.of(oldSet));

		WorkoutTemplateResponse response = service.update(
				50L,
				UpdateWorkoutTemplateRequest.builder()
						.name("Rest Day")
						.description("No planned exercises")
						.exercises(List.of())
						.build());

		assertThat(response.getName()).isEqualTo("Rest Day");
		assertThat(response.getExercises()).isEmpty();
		verify(templateSetRepository).deleteAllInBatch(List.of(oldSet));
		verify(templateExerciseRepository).deleteAllInBatch(List.of(oldExercise));
	}

	@Test
	void deletesExistingTemplate() {
		WorkoutTemplate template = WorkoutTemplate.builder().id(50L).build();
		when(templateRepository.findById(50L)).thenReturn(Optional.of(template));

		service.delete(50L);

		verify(templateRepository).delete(template);
	}
}
