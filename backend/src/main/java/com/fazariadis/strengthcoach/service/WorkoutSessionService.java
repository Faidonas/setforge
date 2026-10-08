package com.fazariadis.strengthcoach.service;

import com.fazariadis.strengthcoach.dto.CompleteWorkoutSessionRequest;
import com.fazariadis.strengthcoach.dto.PreviousExercisePerformanceResponse;
import com.fazariadis.strengthcoach.dto.PreviousExerciseSetResponse;
import com.fazariadis.strengthcoach.dto.StartWorkoutSessionRequest;
import com.fazariadis.strengthcoach.dto.UpdateWorkoutSessionRequest;
import com.fazariadis.strengthcoach.dto.WorkoutSessionExerciseRequest;
import com.fazariadis.strengthcoach.dto.WorkoutSessionResponse;
import com.fazariadis.strengthcoach.dto.WorkoutSetRequest;
import com.fazariadis.strengthcoach.entity.Exercise;
import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.WorkoutSession;
import com.fazariadis.strengthcoach.entity.WorkoutSessionExercise;
import com.fazariadis.strengthcoach.entity.WorkoutSet;
import com.fazariadis.strengthcoach.entity.WorkoutTemplate;
import com.fazariadis.strengthcoach.entity.WorkoutTemplateExercise;
import com.fazariadis.strengthcoach.entity.WorkoutTemplateSet;
import com.fazariadis.strengthcoach.entity.enums.ExerciseType;
import com.fazariadis.strengthcoach.entity.enums.WorkoutSessionStatus;
import com.fazariadis.strengthcoach.exception.InvalidRequestException;
import com.fazariadis.strengthcoach.exception.ResourceNotFoundException;
import com.fazariadis.strengthcoach.mapper.WorkoutSessionMapper;
import com.fazariadis.strengthcoach.repository.ExerciseRepository;
import com.fazariadis.strengthcoach.repository.UserRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSessionExerciseRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSessionRepository;
import com.fazariadis.strengthcoach.repository.WorkoutSetRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateExerciseRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateSetRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class WorkoutSessionService {

    private final WorkoutSessionRepository workoutSessionRepository;
    private final WorkoutSessionExerciseRepository workoutSessionExerciseRepository;
    private final WorkoutSetRepository workoutSetRepository;
    private final WorkoutTemplateRepository workoutTemplateRepository;
    private final WorkoutTemplateExerciseRepository workoutTemplateExerciseRepository;
    private final WorkoutTemplateSetRepository workoutTemplateSetRepository;
    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;
    private final WorkoutSessionMapper workoutSessionMapper;

    @Transactional
    public WorkoutSessionResponse start(StartWorkoutSessionRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User " + request.getUserId() + " was not found"));
        workoutSessionRepository
                .findFirstByUser_IdAndStatusOrderByStartedAtDesc(
                        request.getUserId(), WorkoutSessionStatus.IN_PROGRESS)
                .ifPresent(activeSession -> {
                    throw new InvalidRequestException(
                            "User " + request.getUserId() + " already has workout session "
                                    + activeSession.getId() + " in progress");
                });
		if (request.getTemplateId() != null && request.getSourceWorkoutSessionId() != null) {
			throw new InvalidRequestException(
					"Choose either a template or a completed workout, not both");
		}
		WorkoutTemplate template = request.getTemplateId() == null
                ? null
                : workoutTemplateRepository.findById(request.getTemplateId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Workout template " + request.getTemplateId() + " was not found"));
		if (template != null && !template.getOwner().getId().equals(user.getId())) {
			throw new ResourceNotFoundException("Workout template " + request.getTemplateId() + " was not found");
		}

		WorkoutSession sourceSession = request.getSourceWorkoutSessionId() == null
				? null
				: findSession(request.getSourceWorkoutSessionId());
		if (sourceSession != null && sourceSession.getStatus() != WorkoutSessionStatus.COMPLETED) {
			throw new InvalidRequestException(
					"Only a completed workout can be performed again");
		}
		if (sourceSession != null && !sourceSession.getUser().getId().equals(user.getId())) {
			throw new InvalidRequestException(
					"A workout can only be performed again by its owner");
		}

		WorkoutSession session = workoutSessionRepository.saveAndFlush(WorkoutSession.builder()
                .user(user)
				.sourceTemplate(template != null
						? template
						: sourceSession == null ? null : sourceSession.getSourceTemplate())
				.name(resolveSessionName(request.getName(), template, sourceSession))
                .status(WorkoutSessionStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .build());

        if (template != null) {
            copyTemplatePlan(session, template);
		} else if (sourceSession != null) {
			copyCompletedWorkoutPlan(session, sourceSession);
        }
        return loadResponse(session);
    }

    @Transactional(readOnly = true)
    public WorkoutSessionResponse getById(Long sessionId, Long userId) {
        return loadResponse(findSessionForUser(sessionId, userId));
    }

    @Transactional(readOnly = true)
    public WorkoutSessionResponse getActive(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User " + userId + " was not found");
        }
        return workoutSessionRepository
                .findFirstByUser_IdAndStatusOrderByStartedAtDesc(
                        userId, WorkoutSessionStatus.IN_PROGRESS)
                .map(this::loadResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<WorkoutSessionResponse> getCompletedHistory(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User " + userId + " was not found");
        }
        return workoutSessionRepository
                .findAllByUser_IdAndStatusOrderByStartedAtDesc(
                        userId, WorkoutSessionStatus.COMPLETED)
                .stream()
                .map(this::loadResponse)
                .toList();
    }

	@Transactional(readOnly = true)
	public List<PreviousExercisePerformanceResponse> getPreviousPerformances(
			Long userId, List<Long> exerciseIds) {
		if (!userRepository.existsById(userId)) {
			throw new ResourceNotFoundException("User " + userId + " was not found");
		}
		return exerciseIds.stream()
				.distinct()
				.map(exerciseId -> findPreviousPerformance(userId, exerciseId))
				.filter(java.util.Objects::nonNull)
				.toList();
	}

	private PreviousExercisePerformanceResponse findPreviousPerformance(
			Long userId, Long exerciseId) {
		List<WorkoutSessionExercise> previousExercises = workoutSessionExerciseRepository
				.findAllByWorkoutSession_User_IdAndWorkoutSession_StatusAndExercise_IdOrderByWorkoutSession_CompletedAtDesc(
						userId, WorkoutSessionStatus.COMPLETED, exerciseId);
		for (WorkoutSessionExercise previousExercise : previousExercises) {
			List<WorkoutSet> completedSets = workoutSetRepository
					.findAllBySessionExercise_IdOrderByPositionAsc(previousExercise.getId())
					.stream()
					.filter(WorkoutSet::isCompleted)
					.toList();
			if (!completedSets.isEmpty()) {
				return PreviousExercisePerformanceResponse.builder()
						.exerciseId(exerciseId)
						.workoutSessionId(previousExercise.getWorkoutSession().getId())
						.performedAt(previousExercise.getWorkoutSession().getCompletedAt())
						.sets(completedSets.stream()
								.map(set -> PreviousExerciseSetResponse.builder()
										.position(set.getPosition())
										.setType(set.getSetType())
										.reps(set.getReps())
										.weight(set.getWeight())
										.timeSeconds(set.getTimeSeconds())
										.build())
								.toList())
						.build();
			}
		}
		return null;
	}

    @Transactional
    public WorkoutSessionResponse complete(
            Long sessionId, Long userId, CompleteWorkoutSessionRequest request) {
        WorkoutSession session = requireInProgress(sessionId, userId);
        Map<Long, Exercise> exercisesById = loadExercises(request.getExercises());
        validateResults(request.getExercises(), exercisesById);

        Instant completedAt = Instant.now();
		replaceFinalPlan(session, request.getExercises(), exercisesById, completedAt);
        session.setNotes(request.getNotes());
        session.setStatus(WorkoutSessionStatus.COMPLETED);
        session.setCompletedAt(completedAt);
        workoutSessionRepository.saveAndFlush(session);
        return loadResponse(session);
    }

	@Transactional
	public WorkoutSessionResponse updateCompleted(
			Long sessionId, Long userId, UpdateWorkoutSessionRequest request) {
		WorkoutSession session = findSessionForUser(sessionId, userId);
		if (session.getStatus() != WorkoutSessionStatus.COMPLETED) {
			throw new InvalidRequestException("Only a completed workout can be edited");
		}
		Map<Long, Exercise> exercisesById = loadExercises(request.getExercises());
		validateResults(request.getExercises(), exercisesById);
		replaceFinalPlan(
				session,
				request.getExercises(),
				exercisesById,
				session.getCompletedAt());
		session.setName(request.getName().trim());
		session.setNotes(request.getNotes());
		workoutSessionRepository.saveAndFlush(session);
		return loadResponse(session);
	}

	public WorkoutSessionResponse updateCompleted(Long sessionId, UpdateWorkoutSessionRequest request) {
		return updateCompleted(sessionId, findSession(sessionId).getUser().getId(), request);
	}

	@Transactional
	public void deleteCompleted(Long sessionId, Long userId) {
		WorkoutSession session = findSessionForUser(sessionId, userId);
		if (session.getStatus() == WorkoutSessionStatus.IN_PROGRESS) {
			throw new InvalidRequestException("An active workout must be cancelled before deletion");
		}
		workoutSessionRepository.delete(session);
	}

	public void deleteCompleted(Long sessionId) {
		deleteCompleted(sessionId, findSession(sessionId).getUser().getId());
	}

    @Transactional
    public void cancel(Long sessionId, Long userId) {
        WorkoutSession session = workoutSessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            return;
        }
		if (!session.getUser().getId().equals(userId)) {
			throw new ResourceNotFoundException("Workout session " + sessionId + " was not found");
		}
        if (session.getStatus() != WorkoutSessionStatus.IN_PROGRESS) {
            throw new InvalidRequestException(
                    "Workout session " + sessionId + " is already "
                            + session.getStatus().name().toLowerCase());
        }
        workoutSessionRepository.delete(session);
    }

	public void cancel(Long sessionId) {
		WorkoutSession session = workoutSessionRepository.findById(sessionId).orElse(null);
		if (session == null) return;
		if (session.getStatus() != WorkoutSessionStatus.IN_PROGRESS) {
			throw new InvalidRequestException("Workout session " + sessionId + " is already " + session.getStatus().name().toLowerCase());
		}
		workoutSessionRepository.delete(session);
	}

    private WorkoutSession requireInProgress(Long sessionId, Long userId) {
        WorkoutSession session = findSessionForUser(sessionId, userId);
        if (session.getStatus() != WorkoutSessionStatus.IN_PROGRESS) {
            throw new InvalidRequestException(
                    "Workout session " + sessionId + " is already "
                            + session.getStatus().name().toLowerCase());
        }
        return session;
    }

    private WorkoutSession findSession(Long sessionId) {
        return workoutSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Workout session " + sessionId + " was not found"));
    }

	private WorkoutSession findSessionForUser(Long sessionId, Long userId) {
		WorkoutSession session = findSession(sessionId);
		if (!session.getUser().getId().equals(userId)) {
			throw new ResourceNotFoundException("Workout session " + sessionId + " was not found");
		}
		return session;
	}

	private String resolveSessionName(
			String requestedName, WorkoutTemplate template, WorkoutSession sourceSession) {
        if (template != null) {
            return template.getName();
        }
		if (sourceSession != null) {
			return sourceSession.getName();
		}
        return requestedName == null || requestedName.isBlank()
                ? "Workout"
                : requestedName.trim();
    }

	private void copyCompletedWorkoutPlan(
			WorkoutSession newSession, WorkoutSession sourceSession) {
		List<WorkoutSessionExercise> sourceExercises =
				workoutSessionExerciseRepository.findAllByWorkoutSession_IdOrderByPositionAsc(
						sourceSession.getId());
		Map<Long, List<WorkoutSet>> setsByExerciseId = sourceExercises.isEmpty()
				? Map.of()
				: workoutSetRepository
						.findAllBySessionExercise_IdInOrderBySessionExercise_IdAscPositionAsc(
								sourceExercises.stream().map(WorkoutSessionExercise::getId).toList())
						.stream()
						.collect(Collectors.groupingBy(
								set -> set.getSessionExercise().getId(),
								HashMap::new,
								Collectors.toList()));

		List<WorkoutSet> copiedSets = new ArrayList<>();
		for (WorkoutSessionExercise sourceExercise : sourceExercises) {
			WorkoutSessionExercise copiedExercise = workoutSessionExerciseRepository.save(
					WorkoutSessionExercise.builder()
							.workoutSession(newSession)
							.exercise(sourceExercise.getExercise())
							.sourceTemplateExercise(sourceExercise.getSourceTemplateExercise())
							.position(sourceExercise.getPosition())
							.notes(sourceExercise.getNotes())
							.build());
			for (WorkoutSet sourceSet : setsByExerciseId.getOrDefault(sourceExercise.getId(), List.of())) {
				copiedSets.add(WorkoutSet.builder()
						.sessionExercise(copiedExercise)
						.sourceTemplateSet(sourceSet.getSourceTemplateSet())
						.position(sourceSet.getPosition())
						.setType(sourceSet.getSetType())
						.targetReps(sourceSet.getReps() != null
								? sourceSet.getReps()
								: sourceSet.getTargetReps())
						.targetWeight(sourceSet.getWeight() != null
								? sourceSet.getWeight()
								: sourceSet.getTargetWeight())
						.targetTimeSeconds(sourceSet.getTimeSeconds() != null
								? sourceSet.getTimeSeconds()
								: sourceSet.getTargetTimeSeconds())
						.restSeconds(sourceSet.getRestSeconds())
						.completed(false)
						.build());
			}
		}
		workoutSetRepository.saveAll(copiedSets);
		workoutSetRepository.flush();
	}

    private void copyTemplatePlan(WorkoutSession session, WorkoutTemplate template) {
        List<WorkoutTemplateExercise> templateExercises =
                workoutTemplateExerciseRepository.findAllByWorkoutTemplate_IdOrderByPositionAsc(
                        template.getId());
        Map<Long, List<WorkoutTemplateSet>> setsByExerciseId = templateExercises.isEmpty()
                ? Map.of()
                : workoutTemplateSetRepository
                .findAllByTemplateExercise_IdInOrderByTemplateExercise_IdAscPositionAsc(
                        templateExercises.stream().map(WorkoutTemplateExercise::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(
                        set -> set.getTemplateExercise().getId(),
                        HashMap::new,
                        Collectors.toList()));

        List<WorkoutSet> sessionSets = new ArrayList<>();
        for (WorkoutTemplateExercise templateExercise : templateExercises) {
            WorkoutSessionExercise sessionExercise = workoutSessionExerciseRepository.save(
                    WorkoutSessionExercise.builder()
                            .workoutSession(session)
                            .exercise(templateExercise.getExercise())
                            .sourceTemplateExercise(templateExercise)
                            .position(templateExercise.getPosition())
                            .notes(templateExercise.getNotes())
                            .build());
            for (WorkoutTemplateSet templateSet
                    : setsByExerciseId.getOrDefault(templateExercise.getId(), List.of())) {
                sessionSets.add(WorkoutSet.builder()
                        .sessionExercise(sessionExercise)
                        .sourceTemplateSet(templateSet)
                        .position(templateSet.getPosition())
                        .setType(templateSet.getSetType())
                        .targetReps(templateSet.getTargetReps())
                        .targetWeight(templateSet.getTargetWeight())
                        .targetTimeSeconds(templateSet.getTargetTimeSeconds())
                        .restSeconds(templateSet.getRestSeconds())
                        .completed(false)
                        .build());
            }
        }
        workoutSetRepository.saveAll(sessionSets);
        workoutSetRepository.flush();
    }

    private Map<Long, Exercise> loadExercises(List<WorkoutSessionExerciseRequest> requests) {
        LinkedHashSet<Long> requestedIds = requests.stream()
                .map(WorkoutSessionExerciseRequest::getExerciseId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        Map<Long, Exercise> exercisesById = exerciseRepository.findAllById(requestedIds).stream()
                .collect(Collectors.toMap(Exercise::getId, Function.identity()));
        requestedIds.stream()
                .filter(id -> !exercisesById.containsKey(id))
                .findFirst()
                .ifPresent(id -> {
                    throw new ResourceNotFoundException("Exercise " + id + " was not found");
                });
        return exercisesById;
    }

    private void validateResults(
            List<WorkoutSessionExerciseRequest> requests, Map<Long, Exercise> exercisesById) {
        for (WorkoutSessionExerciseRequest exerciseRequest : requests) {
            Exercise exercise = exercisesById.get(exerciseRequest.getExerciseId());
            for (WorkoutSetRequest setRequest : exerciseRequest.getSets()) {
                if (exercise.getExerciseType() == ExerciseType.TIMED) {
                    if (setRequest.getTargetReps() != null
                            || setRequest.getTargetWeight() != null
                            || setRequest.getReps() != null
                            || setRequest.getWeight() != null) {
                        throw new InvalidRequestException(
                                "Timed exercise '" + exercise.getName()
                                        + "' accepts time values only");
                    }
                    if (Boolean.TRUE.equals(setRequest.getCompleted())
                            && (setRequest.getTimeSeconds() == null
                            || setRequest.getTimeSeconds() < 1)) {
                        throw new InvalidRequestException(
                                "Completed set for '" + exercise.getName()
                                        + "' requires timeSeconds");
                    }
                } else {
                    if (setRequest.getTargetTimeSeconds() != null || setRequest.getTimeSeconds() != null) {
                        throw new InvalidRequestException(
                                "Weight-and-reps exercise '" + exercise.getName()
                                        + "' does not accept time values");
                    }
                    if (Boolean.TRUE.equals(setRequest.getCompleted()) && setRequest.getReps() == null) {
                        throw new InvalidRequestException(
                                "Completed set for '" + exercise.getName() + "' requires reps");
                    }
                }
            }
        }
    }

	private void replaceFinalPlan(
			WorkoutSession session,
			List<WorkoutSessionExerciseRequest> exerciseRequests,
			Map<Long, Exercise> exercisesById,
			Instant completedAt) {
		List<WorkoutSessionExercise> existingExercises =
				workoutSessionExerciseRepository.findAllByWorkoutSession_IdOrderByPositionAsc(
						session.getId());
		Map<Long, WorkoutSessionExercise> existingExerciseById = existingExercises.stream()
				.collect(Collectors.toMap(WorkoutSessionExercise::getId, Function.identity()));
		List<WorkoutSet> existingSets = existingExercises.isEmpty()
				? List.of()
				: workoutSetRepository
						.findAllBySessionExercise_IdInOrderBySessionExercise_IdAscPositionAsc(
								existingExercises.stream().map(WorkoutSessionExercise::getId).toList());
		Map<Long, WorkoutSet> existingSetById = existingSets.stream()
				.collect(Collectors.toMap(WorkoutSet::getId, Function.identity()));

		if (!existingSets.isEmpty()) {
			workoutSetRepository.deleteAllInBatch(existingSets);
		}
		if (!existingExercises.isEmpty()) {
			workoutSessionExerciseRepository.deleteAllInBatch(existingExercises);
		}
		saveFinalPlan(
				session,
				exerciseRequests,
				exercisesById,
				existingExerciseById,
				existingSetById,
				completedAt);
	}

	private void saveFinalPlan(
            WorkoutSession session,
            List<WorkoutSessionExerciseRequest> exerciseRequests,
            Map<Long, Exercise> exercisesById,
            Map<Long, WorkoutSessionExercise> existingExerciseById,
            Map<Long, WorkoutSet> existingSetById,
            Instant completedAt) {
        List<WorkoutSet> savedSets = new ArrayList<>();
        for (int exercisePosition = 0; exercisePosition < exerciseRequests.size(); exercisePosition++) {
            WorkoutSessionExerciseRequest exerciseRequest = exerciseRequests.get(exercisePosition);
            WorkoutSessionExercise previousExercise =
                    existingExerciseById.get(exerciseRequest.getId());
            WorkoutTemplateExercise sourceExercise = previousExercise != null
                    && previousExercise.getExercise().getId().equals(exerciseRequest.getExerciseId())
                    ? previousExercise.getSourceTemplateExercise()
                    : null;
            WorkoutSessionExercise sessionExercise = workoutSessionExerciseRepository.save(
                    WorkoutSessionExercise.builder()
                            .workoutSession(session)
                            .exercise(exercisesById.get(exerciseRequest.getExerciseId()))
                            .sourceTemplateExercise(sourceExercise)
                            .position(exercisePosition)
                            .notes(exerciseRequest.getNotes())
                            .build());

            for (int setPosition = 0; setPosition < exerciseRequest.getSets().size(); setPosition++) {
                WorkoutSetRequest setRequest = exerciseRequest.getSets().get(setPosition);
                WorkoutSet previousSet = existingSetById.get(setRequest.getId());
                WorkoutTemplateSet sourceSet = previousSet != null
                        && previousSet.getSessionExercise().getId().equals(exerciseRequest.getId())
                        ? previousSet.getSourceTemplateSet()
                        : null;
                boolean completed = Boolean.TRUE.equals(setRequest.getCompleted());
                savedSets.add(WorkoutSet.builder()
                        .sessionExercise(sessionExercise)
                        .sourceTemplateSet(sourceSet)
                        .position(setPosition)
                        .setType(setRequest.getSetType())
                        .targetReps(setRequest.getTargetReps())
                        .targetWeight(setRequest.getTargetWeight())
                        .targetTimeSeconds(setRequest.getTargetTimeSeconds())
                        .restSeconds(setRequest.getRestSeconds())
                        .reps(setRequest.getReps())
                        .weight(setRequest.getWeight())
                        .timeSeconds(setRequest.getTimeSeconds())
                        .completed(completed)
                        .completedAt(completed ? completedAt : null)
                        .build());
            }
        }
        workoutSetRepository.saveAll(savedSets);
        workoutSetRepository.flush();
    }

    private WorkoutSessionResponse loadResponse(WorkoutSession session) {
        List<WorkoutSessionExercise> sessionExercises =
                workoutSessionExerciseRepository.findAllByWorkoutSession_IdOrderByPositionAsc(
                        session.getId());
        if (sessionExercises.isEmpty()) {
            return workoutSessionMapper.toResponse(session, List.of(), Map.of());
        }

        Map<Long, List<WorkoutSet>> setsByExerciseId = workoutSetRepository
                .findAllBySessionExercise_IdInOrderBySessionExercise_IdAscPositionAsc(
                        sessionExercises.stream().map(WorkoutSessionExercise::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(
                        set -> set.getSessionExercise().getId(),
                        HashMap::new,
                        Collectors.toList()));
        return workoutSessionMapper.toResponse(session, sessionExercises, setsByExerciseId);
    }
}
