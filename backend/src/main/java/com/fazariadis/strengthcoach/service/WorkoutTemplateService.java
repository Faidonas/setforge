package com.fazariadis.strengthcoach.service;

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
import com.fazariadis.strengthcoach.exception.InvalidRequestException;
import com.fazariadis.strengthcoach.exception.ResourceNotFoundException;
import com.fazariadis.strengthcoach.mapper.WorkoutTemplateMapper;
import com.fazariadis.strengthcoach.repository.ExerciseRepository;
import com.fazariadis.strengthcoach.repository.UserRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateExerciseRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateSetRepository;
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
public class WorkoutTemplateService {

	private final WorkoutTemplateRepository workoutTemplateRepository;
	private final WorkoutTemplateExerciseRepository workoutTemplateExerciseRepository;
	private final WorkoutTemplateSetRepository workoutTemplateSetRepository;
	private final UserRepository userRepository;
	private final ExerciseRepository exerciseRepository;
	private final WorkoutTemplateMapper workoutTemplateMapper;

	@Transactional
	public WorkoutTemplateResponse create(CreateWorkoutTemplateRequest request) {
		User owner = userRepository.findById(request.getOwnerId())
				.orElseThrow(() -> new ResourceNotFoundException(
						"User " + request.getOwnerId() + " was not found"));
		Map<Long, Exercise> exercisesById = loadExercises(request.getExercises());
		validatePlan(request.getExercises(), exercisesById);

		WorkoutTemplate template = workoutTemplateRepository.saveAndFlush(WorkoutTemplate.builder()
				.owner(owner)
				.name(request.getName().trim())
				.description(request.getDescription())
				.build());
		replacePlan(template, request.getExercises(), exercisesById);

		return loadResponse(template);
	}

	@Transactional
	public WorkoutTemplateResponse update(Long templateId, UpdateWorkoutTemplateRequest request) {
		WorkoutTemplate template = findTemplate(templateId);
		Map<Long, Exercise> exercisesById = loadExercises(request.getExercises());
		validatePlan(request.getExercises(), exercisesById);

		template.setName(request.getName().trim());
		template.setDescription(request.getDescription());
		workoutTemplateRepository.saveAndFlush(template);

		List<WorkoutTemplateExercise> existingExercises =
				workoutTemplateExerciseRepository.findAllByWorkoutTemplate_IdOrderByPositionAsc(templateId);
		if (!existingExercises.isEmpty()) {
			List<Long> existingExerciseIds = existingExercises.stream()
					.map(WorkoutTemplateExercise::getId)
					.toList();
			List<WorkoutTemplateSet> existingSets = workoutTemplateSetRepository
					.findAllByTemplateExercise_IdInOrderByTemplateExercise_IdAscPositionAsc(
							existingExerciseIds);
			workoutTemplateSetRepository.deleteAllInBatch(existingSets);
			workoutTemplateExerciseRepository.deleteAllInBatch(existingExercises);
		}

		replacePlan(template, request.getExercises(), exercisesById);
		return loadResponse(template);
	}

	@Transactional(readOnly = true)
	public WorkoutTemplateResponse getById(Long templateId) {
		return loadResponse(findTemplate(templateId));
	}

	@Transactional
	public void delete(Long templateId) {
		workoutTemplateRepository.delete(findTemplate(templateId));
	}

	@Transactional(readOnly = true)
	public List<WorkoutTemplateResponse> getByOwner(Long ownerId) {
		if (!userRepository.existsById(ownerId)) {
			throw new ResourceNotFoundException("User " + ownerId + " was not found");
		}
		return workoutTemplateRepository.findAllByOwner_IdOrderByUpdatedAtDesc(ownerId).stream()
				.map(this::loadResponse)
				.toList();
	}

	private WorkoutTemplate findTemplate(Long templateId) {
		return workoutTemplateRepository.findById(templateId)
				.orElseThrow(() -> new ResourceNotFoundException(
						"Workout template " + templateId + " was not found"));
	}

	private Map<Long, Exercise> loadExercises(List<WorkoutTemplateExerciseRequest> requests) {
		LinkedHashSet<Long> requestedIds = requests.stream()
				.map(WorkoutTemplateExerciseRequest::getExerciseId)
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

	private void validatePlan(
			List<WorkoutTemplateExerciseRequest> requests, Map<Long, Exercise> exercisesById) {
		for (WorkoutTemplateExerciseRequest exerciseRequest : requests) {
			Exercise exercise = exercisesById.get(exerciseRequest.getExerciseId());
			for (WorkoutTemplateSetRequest setRequest : exerciseRequest.getSets()) {
				if (exercise.getExerciseType() == ExerciseType.TIMED) {
					if (setRequest.getTargetReps() != null || setRequest.getTargetWeight() != null) {
						throw new InvalidRequestException(
								"Timed exercise '" + exercise.getName()
										+ "' accepts only targetTimeSeconds");
					}
					if (setRequest.getTargetTimeSeconds() == null) {
						throw new InvalidRequestException(
								"Timed exercise '" + exercise.getName()
										+ "' requires targetTimeSeconds for every set");
					}
				} else if (setRequest.getTargetTimeSeconds() != null) {
					throw new InvalidRequestException(
							"Weight-and-reps exercise '" + exercise.getName()
									+ "' does not accept targetTimeSeconds");
				}
			}
		}
	}

	private void replacePlan(
			WorkoutTemplate template,
			List<WorkoutTemplateExerciseRequest> exerciseRequests,
			Map<Long, Exercise> exercisesById) {
		List<WorkoutTemplateSet> sets = new ArrayList<>();
		for (int exercisePosition = 0; exercisePosition < exerciseRequests.size(); exercisePosition++) {
			WorkoutTemplateExerciseRequest exerciseRequest = exerciseRequests.get(exercisePosition);
			WorkoutTemplateExercise templateExercise = workoutTemplateExerciseRepository.save(
					WorkoutTemplateExercise.builder()
							.workoutTemplate(template)
							.exercise(exercisesById.get(exerciseRequest.getExerciseId()))
							.position(exercisePosition)
							.notes(exerciseRequest.getNotes())
							.build());

			for (int setPosition = 0; setPosition < exerciseRequest.getSets().size(); setPosition++) {
				WorkoutTemplateSetRequest setRequest = exerciseRequest.getSets().get(setPosition);
				sets.add(WorkoutTemplateSet.builder()
						.templateExercise(templateExercise)
						.position(setPosition)
						.setType(setRequest.getSetType())
						.targetReps(setRequest.getTargetReps())
						.targetWeight(setRequest.getTargetWeight())
						.targetTimeSeconds(setRequest.getTargetTimeSeconds())
						.restSeconds(setRequest.getRestSeconds())
						.build());
			}
		}
		workoutTemplateSetRepository.saveAll(sets);
		workoutTemplateSetRepository.flush();
	}

	private WorkoutTemplateResponse loadResponse(WorkoutTemplate template) {
		List<WorkoutTemplateExercise> templateExercises =
				workoutTemplateExerciseRepository.findAllByWorkoutTemplate_IdOrderByPositionAsc(
						template.getId());
		if (templateExercises.isEmpty()) {
			return workoutTemplateMapper.toResponse(template, List.of(), Map.of());
		}

		List<Long> templateExerciseIds =
				templateExercises.stream().map(WorkoutTemplateExercise::getId).toList();
		Map<Long, List<WorkoutTemplateSet>> setsByExerciseId = workoutTemplateSetRepository
				.findAllByTemplateExercise_IdInOrderByTemplateExercise_IdAscPositionAsc(
						templateExerciseIds)
				.stream()
				.collect(Collectors.groupingBy(
						set -> set.getTemplateExercise().getId(),
						HashMap::new,
						Collectors.toList()));
		return workoutTemplateMapper.toResponse(template, templateExercises, setsByExerciseId);
	}
}
