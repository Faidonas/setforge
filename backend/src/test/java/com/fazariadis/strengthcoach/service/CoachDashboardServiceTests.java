package com.fazariadis.strengthcoach.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fazariadis.strengthcoach.dto.CoachDashboardResponse;
import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.entity.enums.CoachingStatus;
import com.fazariadis.strengthcoach.exception.ForbiddenOperationException;
import com.fazariadis.strengthcoach.repository.CoachingRelationshipRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSessionExerciseRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSessionRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSetRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateRepository;
import java.util.List;
import org.junit.jupiter.api.Test;

class CoachDashboardServiceTests {

	private final CoachingRelationshipRepository relationshipRepository = mock(CoachingRelationshipRepository.class);
	private final WorkoutSessionRepository workoutSessionRepository = mock(WorkoutSessionRepository.class);
	private final WorkoutTemplateRepository workoutTemplateRepository = mock(WorkoutTemplateRepository.class);
	private final WorkoutSessionExerciseRepository sessionExerciseRepository = mock(WorkoutSessionExerciseRepository.class);
	private final WorkoutSetRepository workoutSetRepository = mock(WorkoutSetRepository.class);
	private final CoachDashboardService service = new CoachDashboardService(
			relationshipRepository,
			workoutSessionRepository,
			workoutTemplateRepository,
			sessionExerciseRepository,
			workoutSetRepository);

	@Test
	void dashboardReturnsStoredCoachCounts() {
		User coach = User.builder().id(8L).displayName("Alex Trainer")
				.accountType(AccountType.PERSONAL_TRAINER).build();
		when(relationshipRepository.findAllByTrainer_IdAndStatusOrderByCreatedAtDesc(8L, CoachingStatus.ACTIVE))
				.thenReturn(List.of());
		when(workoutTemplateRepository.countByOwner_Id(8L)).thenReturn(3L);

		CoachDashboardResponse response = service.getDashboard(coach);

		assertThat(response.getCoachName()).isEqualTo("Alex Trainer");
		assertThat(response.getActiveClientCount()).isZero();
		assertThat(response.getTemplateCount()).isEqualTo(3L);
		assertThat(response.getRecentWorkouts()).isEmpty();
	}

	@Test
	void dashboardRequiresTrainerAccount() {
		User athlete = User.builder().id(9L).accountType(AccountType.INDIVIDUAL).build();

		assertThatThrownBy(() -> service.getDashboard(athlete))
				.isInstanceOf(ForbiddenOperationException.class)
				.hasMessage("A personal trainer account is required");
	}
}
