package com.fazariadis.strengthcoach.service;

import com.fazariadis.strengthcoach.dto.CoachClientDetailResponse;
import com.fazariadis.strengthcoach.dto.CoachClientSummaryResponse;
import com.fazariadis.strengthcoach.dto.CoachDashboardResponse;
import com.fazariadis.strengthcoach.dto.CoachWorkoutSummaryResponse;
import com.fazariadis.strengthcoach.entity.CoachingRelationship;
import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.WorkoutSession;
import com.fazariadis.strengthcoach.entity.WorkoutSessionExercise;
import com.fazariadis.strengthcoach.entity.WorkoutSet;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.entity.enums.CoachingStatus;
import com.fazariadis.strengthcoach.entity.enums.WorkoutSessionStatus;
import com.fazariadis.strengthcoach.exception.ForbiddenOperationException;
import com.fazariadis.strengthcoach.exception.ResourceNotFoundException;
import com.fazariadis.strengthcoach.repository.CoachingRelationshipRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSessionExerciseRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSessionRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSetRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class CoachDashboardService {

	private static final Duration REPORTING_WINDOW = Duration.ofDays(28);
	private static final Duration ATTENTION_WINDOW = Duration.ofDays(7);

	private final CoachingRelationshipRepository relationshipRepository;
	private final WorkoutSessionRepository workoutSessionRepository;
	private final WorkoutTemplateRepository workoutTemplateRepository;
	private final WorkoutSessionExerciseRepository sessionExerciseRepository;
	private final WorkoutSetRepository workoutSetRepository;

	@Transactional(readOnly = true)
	public CoachDashboardResponse getDashboard(User coach) {
		requireCoach(coach);
		Instant now = Instant.now();
		List<ClientData> clients = loadActiveClients(coach, now);
		List<CoachClientSummaryResponse> attention = clients.stream()
				.filter(client -> client.lastWorkoutAt() == null
						|| client.lastWorkoutAt().isBefore(now.minus(ATTENTION_WINDOW)))
				.map(ClientData::summary)
				.toList();
		List<CoachWorkoutSummaryResponse> recent = clients.stream()
				.flatMap(client -> client.sessions().stream()
						.map(session -> toWorkoutSummary(session, client.relationship().getClient())))
				.sorted(Comparator.comparing(CoachWorkoutSummaryResponse::getCompletedAt,
						Comparator.nullsLast(Comparator.reverseOrder())))
				.limit(6)
				.toList();

		return CoachDashboardResponse.builder()
				.coachId(coach.getId())
				.coachName(coach.getDisplayName())
				.activeClientCount(clients.size())
				.templateCount(workoutTemplateRepository.countByOwner_Id(coach.getId()))
				.completedWorkoutsLast28Days(clients.stream()
						.mapToLong(client -> client.summary().getCompletedWorkoutsLast28Days()).sum())
				.clientsNeedingAttention(attention.size())
				.attentionClients(attention)
				.recentWorkouts(recent)
				.build();
	}

	@Transactional(readOnly = true)
	public List<CoachClientSummaryResponse> getClients(User coach) {
		requireCoach(coach);
		return loadActiveClients(coach, Instant.now()).stream().map(ClientData::summary).toList();
	}

	@Transactional(readOnly = true)
	public CoachClientDetailResponse getClient(User coach, Long clientId) {
		requireCoach(coach);
		CoachingRelationship relationship = relationshipRepository
				.findAllByTrainer_IdAndStatusOrderByCreatedAtDesc(coach.getId(), CoachingStatus.ACTIVE)
				.stream()
				.filter(candidate -> candidate.getClient().getId().equals(clientId))
				.findFirst()
				.orElseThrow(() -> new ResourceNotFoundException("Active client " + clientId + " was not found"));
		Instant cutoff = Instant.now().minus(REPORTING_WINDOW);
		List<WorkoutSession> sessions = completedSessions(clientId);
		List<WorkoutSession> inWindow = sessions.stream().filter(session -> completedAfter(session, cutoff)).toList();
		return CoachClientDetailResponse.builder()
				.id(relationship.getClient().getId())
				.displayName(relationship.getClient().getDisplayName())
				.email(relationship.getClient().getEmail())
				.relationshipStatus(relationship.getStatus())
				.coachingSince(relationship.getStartedAt() != null ? relationship.getStartedAt() : relationship.getCreatedAt())
				.completedWorkoutsLast28Days(inWindow.size())
				.totalVolumeLast28Days(inWindow.stream().map(this::calculateVolume)
						.reduce(BigDecimal.ZERO, BigDecimal::add))
				.lastWorkoutAt(sessions.isEmpty() ? null : sessions.getFirst().getCompletedAt())
				.recentWorkouts(sessions.stream().limit(8)
						.map(session -> toWorkoutSummary(session, relationship.getClient())).toList())
				.build();
	}

	private List<ClientData> loadActiveClients(User coach, Instant now) {
		Instant cutoff = now.minus(REPORTING_WINDOW);
		return relationshipRepository
				.findAllByTrainer_IdAndStatusOrderByCreatedAtDesc(coach.getId(), CoachingStatus.ACTIVE)
				.stream()
				.map(relationship -> {
					List<WorkoutSession> sessions = completedSessions(relationship.getClient().getId());
					WorkoutSession latest = sessions.isEmpty() ? null : sessions.getFirst();
					CoachClientSummaryResponse summary = CoachClientSummaryResponse.builder()
							.id(relationship.getClient().getId())
							.displayName(relationship.getClient().getDisplayName())
							.email(relationship.getClient().getEmail())
							.relationshipStatus(relationship.getStatus())
							.coachingSince(relationship.getStartedAt() != null
									? relationship.getStartedAt() : relationship.getCreatedAt())
							.completedWorkoutsLast28Days(sessions.stream()
									.filter(session -> completedAfter(session, cutoff)).count())
							.lastWorkoutAt(latest == null ? null : latest.getCompletedAt())
							.lastWorkoutName(latest == null ? null : latest.getName())
							.build();
					return new ClientData(relationship, summary, sessions);
				})
				.toList();
	}

	private List<WorkoutSession> completedSessions(Long clientId) {
		return workoutSessionRepository.findAllByUser_IdAndStatusOrderByStartedAtDesc(
				clientId, WorkoutSessionStatus.COMPLETED);
	}

	private boolean completedAfter(WorkoutSession session, Instant cutoff) {
		return session.getCompletedAt() != null && !session.getCompletedAt().isBefore(cutoff);
	}

	private CoachWorkoutSummaryResponse toWorkoutSummary(WorkoutSession session, User client) {
		Long duration = session.getCompletedAt() == null ? null
				: Math.max(0, Duration.between(session.getStartedAt(), session.getCompletedAt()).toMinutes());
		return CoachWorkoutSummaryResponse.builder()
				.id(session.getId())
				.clientId(client.getId())
				.clientName(client.getDisplayName())
				.name(session.getName())
				.startedAt(session.getStartedAt())
				.completedAt(session.getCompletedAt())
				.durationMinutes(duration)
				.totalVolume(calculateVolume(session))
				.build();
	}

	private BigDecimal calculateVolume(WorkoutSession session) {
		List<Long> exerciseIds = sessionExerciseRepository
				.findAllByWorkoutSession_IdOrderByPositionAsc(session.getId()).stream()
				.map(WorkoutSessionExercise::getId)
				.toList();
		if (exerciseIds.isEmpty()) return BigDecimal.ZERO;
		return workoutSetRepository
				.findAllBySessionExercise_IdInOrderBySessionExercise_IdAscPositionAsc(exerciseIds).stream()
				.filter(WorkoutSet::isCompleted)
				.filter(set -> set.getWeight() != null && set.getReps() != null)
				.map(set -> set.getWeight().multiply(BigDecimal.valueOf(set.getReps())))
				.reduce(BigDecimal.ZERO, BigDecimal::add);
	}

	private void requireCoach(User user) {
		if (user.getAccountType() != AccountType.PERSONAL_TRAINER) {
			throw new ForbiddenOperationException("A personal trainer account is required");
		}
	}

	private record ClientData(
			CoachingRelationship relationship,
			CoachClientSummaryResponse summary,
			List<WorkoutSession> sessions) {
		private Instant lastWorkoutAt() {
			return summary.getLastWorkoutAt();
		}
	}
}
