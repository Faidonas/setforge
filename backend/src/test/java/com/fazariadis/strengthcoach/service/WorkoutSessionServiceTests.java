package com.fazariadis.strengthcoach.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fazariadis.strengthcoach.dto.StartWorkoutSessionRequest;
import com.fazariadis.strengthcoach.dto.WorkoutSessionResponse;
import com.fazariadis.strengthcoach.entity.Exercise;
import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.WorkoutSession;
import com.fazariadis.strengthcoach.entity.WorkoutSessionExercise;
import com.fazariadis.strengthcoach.entity.WorkoutSet;
import com.fazariadis.strengthcoach.entity.WorkoutTemplate;
import com.fazariadis.strengthcoach.entity.WorkoutTemplateExercise;
import com.fazariadis.strengthcoach.entity.WorkoutTemplateSet;
import com.fazariadis.strengthcoach.mapper.WorkoutSessionMapper;
import com.fazariadis.strengthcoach.entity.enums.WorkoutSessionStatus;
import com.fazariadis.strengthcoach.exception.InvalidRequestException;
import com.fazariadis.strengthcoach.repository.ExerciseRepository;
import com.fazariadis.strengthcoach.repository.UserRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSessionExerciseRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSessionRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSetRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateExerciseRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateSetRepository;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class WorkoutSessionServiceTests {

	private final WorkoutSessionRepository sessionRepository = mock(WorkoutSessionRepository.class);
	private final WorkoutSessionExerciseRepository sessionExerciseRepository =
			mock(WorkoutSessionExerciseRepository.class);
	private final WorkoutSetRepository workoutSetRepository = mock(WorkoutSetRepository.class);
	private final WorkoutTemplateRepository templateRepository = mock(WorkoutTemplateRepository.class);
	private final WorkoutTemplateExerciseRepository templateExerciseRepository =
			mock(WorkoutTemplateExerciseRepository.class);
	private final WorkoutTemplateSetRepository templateSetRepository =
			mock(WorkoutTemplateSetRepository.class);
	private final UserRepository userRepository = mock(UserRepository.class);
	private final ExerciseRepository exerciseRepository = mock(ExerciseRepository.class);
	private final WorkoutSessionService service = new WorkoutSessionService(
			sessionRepository,
			sessionExerciseRepository,
			workoutSetRepository,
			templateRepository,
			templateExerciseRepository,
			templateSetRepository,
			userRepository,
			exerciseRepository,
			new WorkoutSessionMapper());

	@Test
	void rejectsStartingAnotherWorkoutWhileOneIsActive() {
		User user = User.builder().id(1L).build();
		WorkoutSession activeSession = WorkoutSession.builder()
				.id(40L)
				.user(user)
				.status(WorkoutSessionStatus.IN_PROGRESS)
				.build();
		when(userRepository.findById(1L)).thenReturn(Optional.of(user));
		when(sessionRepository.findFirstByUser_IdAndStatusOrderByStartedAtDesc(
				1L, WorkoutSessionStatus.IN_PROGRESS))
				.thenReturn(Optional.of(activeSession));

		assertThatThrownBy(() -> service.start(StartWorkoutSessionRequest.builder()
				.userId(1L)
				.build()))
				.isInstanceOf(InvalidRequestException.class)
				.hasMessage("User 1 already has workout session 40 in progress");
		verify(sessionRepository, never()).saveAndFlush(any(WorkoutSession.class));
	}

	@Test
	void startsFromTemplateByCopyingItsPlannedSets() {
		User user = User.builder().id(1L).build();
		WorkoutTemplate template = WorkoutTemplate.builder()
				.id(5L)
				.owner(user)
				.name("Upper Body")
				.build();
		Exercise bench = Exercise.builder()
				.id(10L)
				.name("Bench Press")
				.primaryMuscle("Chest")
				.equipment("Barbell")
				.build();
		WorkoutTemplateExercise plannedExercise = WorkoutTemplateExercise.builder()
				.id(20L)
				.workoutTemplate(template)
				.exercise(bench)
				.position(0)
				.build();
		WorkoutTemplateSet plannedSet = WorkoutTemplateSet.builder()
				.id(30L)
				.templateExercise(plannedExercise)
				.position(0)
				.targetReps(8)
				.targetWeight(new BigDecimal("80.00"))
				.restSeconds(90)
				.build();

		when(userRepository.findById(1L)).thenReturn(Optional.of(user));
		when(templateRepository.findById(5L)).thenReturn(Optional.of(template));
		when(sessionRepository.saveAndFlush(any(WorkoutSession.class))).thenAnswer(invocation -> {
			WorkoutSession session = invocation.getArgument(0);
			session.setId(40L);
			return session;
		});
		when(templateExerciseRepository.findAllByWorkoutTemplate_IdOrderByPositionAsc(5L))
				.thenReturn(List.of(plannedExercise));
		when(templateSetRepository
				.findAllByTemplateExercise_IdInOrderByTemplateExercise_IdAscPositionAsc(
						any(Collection.class)))
				.thenReturn(List.of(plannedSet));
		when(sessionExerciseRepository.save(any(WorkoutSessionExercise.class)))
				.thenAnswer(invocation -> {
					WorkoutSessionExercise exercise = invocation.getArgument(0);
					exercise.setId(50L);
					return exercise;
				});
		when(workoutSetRepository.saveAll(any(Iterable.class))).thenAnswer(invocation -> {
			List<WorkoutSet> sets = invocation.getArgument(0);
			sets.getFirst().setId(60L);
			return sets;
		});
		when(sessionExerciseRepository.findAllByWorkoutSession_IdOrderByPositionAsc(40L))
				.thenAnswer(invocation -> List.of(WorkoutSessionExercise.builder()
						.id(50L)
						.workoutSession(WorkoutSession.builder().id(40L).build())
						.exercise(bench)
						.sourceTemplateExercise(plannedExercise)
						.position(0)
						.build()));
		when(workoutSetRepository
				.findAllBySessionExercise_IdInOrderBySessionExercise_IdAscPositionAsc(
						any(Collection.class)))
				.thenAnswer(invocation -> List.of(WorkoutSet.builder()
						.id(60L)
						.sessionExercise(WorkoutSessionExercise.builder().id(50L).build())
						.position(0)
						.targetReps(8)
						.targetWeight(new BigDecimal("80.00"))
						.restSeconds(90)
						.build()));

		WorkoutSessionResponse response = service.start(StartWorkoutSessionRequest.builder()
				.userId(1L)
				.templateId(5L)
				.build());

		assertThat(response.getName()).isEqualTo("Upper Body");
		assertThat(response.getSourceTemplateId()).isEqualTo(5L);
		assertThat(response.getExercises()).hasSize(1);
		assertThat(response.getExercises().getFirst().getSets().getFirst().getTargetReps())
				.isEqualTo(8);
		assertThat(response.getExercises().getFirst().getSets().getFirst().getRestSeconds())
				.isEqualTo(90);
	}
}
