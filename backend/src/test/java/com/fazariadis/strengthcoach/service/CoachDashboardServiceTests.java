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
	private final CoachAccessPolicy coachAccessPolicy = new CoachAccessPolicy();
	private final CoachDashboardService service = new CoachDashboardService(
			relationshipRepository,
			workoutSessionRepository,
			workoutTemplateRepository,
			sessionExerciseRepository,
			workoutSetRepository,
			coachAccessPolicy);

	@Test
	void dashboardReturnsStoredCoachCounts() {
		User coach = User.builder().id(42L).displayName("Faidon Azariadis")
				.accountType(AccountType.ADMIN).build();
		when(relationshipRepository.findAllByTrainer_IdAndStatusOrderByCreatedAtDesc(42L, CoachingStatus.ACTIVE))
				.thenReturn(List.of());
		when(workoutTemplateRepository.countByOwner_Id(42L)).thenReturn(3L);

		CoachDashboardResponse response = service.getDashboard(coach);

		assertThat(response.getCoachName()).isEqualTo("Faidon Azariadis");
		assertThat(response.isAdmin()).isTrue();
		assertThat(response.getActiveClientCount()).isZero();
		assertThat(response.getTemplateCount()).isEqualTo(3L);
		assertThat(response.getRecentWorkouts()).isEmpty();
	}

	@Test
	void dashboardRejectsIndividualAccounts() {
		User athlete = User.builder().id(9L).accountType(AccountType.INDIVIDUAL).build();

		assertThatThrownBy(() -> service.getDashboard(athlete))
				.isInstanceOf(ForbiddenOperationException.class)
				.hasMessage("Coach dashboard access is not enabled for this account");
	}

	@Test
	void manuallyAssignedTrainerRoleHasCoachAccess() {
		assertThat(coachAccessPolicy.hasAccess(AccountType.PERSONAL_TRAINER)).isTrue();
	}
}
