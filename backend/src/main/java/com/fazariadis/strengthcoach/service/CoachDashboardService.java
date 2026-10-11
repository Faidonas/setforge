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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Slf4j
public class CoachDashboardService {

	private static final Duration REPORTING_WINDOW = Duration.ofDays(28);
	private static final Duration ATTENTION_WINDOW = Duration.ofDays(7);

	private final CoachingRelationshipRepository relationshipRepository;
	private final WorkoutSessionRepository workoutSessionRepository;
	private final WorkoutTemplateRepository workoutTemplateRepository;
	private final WorkoutSessionExerciseRepository sessionExerciseRepository;
	private final WorkoutSetRepository workoutSetRepository;
	private final CoachAccessPolicy coachAccessPolicy;

	@Transactional(readOnly = true)
	public CoachDashboardResponse getDashboard(User coach) {
		requireCoach(coach);
		long startedAt = System.nanoTime();
		log.info("area=coach-dashboard action=get-dashboard event=start coachUserId={}", coach.getId());
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

		CoachDashboardResponse response = CoachDashboardResponse.builder()
				.coachId(coach.getId())
				.coachName(coach.getDisplayName())
				.admin(coach.getAccountType() == AccountType.ADMIN)
				.activeClientCount(clients.size())
				.templateCount(workoutTemplateRepository.countByOwner_Id(coach.getId()))
				.completedWorkoutsLast28Days(clients.stream()
						.mapToLong(client -> client.summary().getCompletedWorkoutsLast28Days()).sum())
				.clientsNeedingAttention(attention.size())
				.attentionClients(attention)
				.recentWorkouts(recent)
				.build();
		log.info("area=coach-dashboard action=get-dashboard event=success coachUserId={} activeClients={} recentWorkouts={} durationMs={}",
				coach.getId(), response.getActiveClientCount(), response.getRecentWorkouts().size(), elapsedMillis(startedAt));
		return response;
	}

	@Transactional(readOnly = true)
	public List<CoachClientSummaryResponse> getClients(User coach) {
		requireCoach(coach);
		long startedAt = System.nanoTime();
		log.info("area=coach-dashboard action=get-clients event=start coachUserId={}", coach.getId());
		List<CoachClientSummaryResponse> clients = loadActiveClients(coach, Instant.now()).stream()
				.map(ClientData::summary).toList();
		log.info("area=coach-dashboard action=get-clients event=success coachUserId={} clientCount={} durationMs={}",
				coach.getId(), clients.size(), elapsedMillis(startedAt));
		return clients;
	}

	@Transactional(readOnly = true)
	public CoachClientDetailResponse getClient(User coach, Long clientId) {
		requireCoach(coach);
		long startedAt = System.nanoTime();
		log.info("area=coach-dashboard action=get-client event=start coachUserId={} clientUserId={}",
				coach.getId(), clientId);
		CoachingRelationship relationship = relationshipRepository
				.findAllByTrainer_IdAndStatusOrderByCreatedAtDesc(coach.getId(), CoachingStatus.ACTIVE)
				.stream()
				.filter(candidate -> candidate.getClient().getId().equals(clientId))
				.findFirst()
				.orElseThrow(() -> {
					log.warn("area=coach-dashboard action=get-client event=not-found coachUserId={} clientUserId={}",
							coach.getId(), clientId);
					return new ResourceNotFoundException("Active client " + clientId + " was not found");
				});
		Instant cutoff = Instant.now().minus(REPORTING_WINDOW);
		List<WorkoutSession> sessions = completedSessions(clientId);
		List<WorkoutSession> inWindow = sessions.stream().filter(session -> completedAfter(session, cutoff)).toList();
		CoachClientDetailResponse response = CoachClientDetailResponse.builder()
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
		log.info("area=coach-dashboard action=get-client event=success coachUserId={} clientUserId={} recentWorkoutCount={} durationMs={}",
				coach.getId(), clientId, response.getRecentWorkouts().size(), elapsedMillis(startedAt));
		return response;
	}

	private long elapsedMillis(long startedAt) {
		return (System.nanoTime() - startedAt) / 1_000_000;
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
		coachAccessPolicy.requireAccess(user);
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
