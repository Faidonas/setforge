package com.fazariadis.strengthcoach.service;

import com.fazariadis.strengthcoach.dto.CreateWorkoutTemplateRequest;
import com.fazariadis.strengthcoach.dto.ReorderWorkoutTemplatesRequest;
import com.fazariadis.strengthcoach.dto.UpdateWorkoutTemplateRequest;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateExerciseRequest;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateResponse;
import com.fazariadis.strengthcoach.dto.WorkoutTemplateSetRequest;
import com.fazariadis.strengthcoach.entity.Exercise;
import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.WorkoutTemplate;
import com.fazariadis.strengthcoach.entity.WorkoutTemplateAssignment;
import com.fazariadis.strengthcoach.entity.WorkoutTemplateExercise;
import com.fazariadis.strengthcoach.entity.WorkoutTemplateSet;
import com.fazariadis.strengthcoach.entity.enums.ExerciseType;
import com.fazariadis.strengthcoach.exception.InvalidRequestException;
import com.fazariadis.strengthcoach.exception.ResourceNotFoundException;
import com.fazariadis.strengthcoach.mapper.WorkoutTemplateMapper;
import com.fazariadis.strengthcoach.repository.ExerciseRepository;
import com.fazariadis.strengthcoach.repository.UserRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateExerciseRepository;
import com.fazariadis.strengthcoach.repository.WorkoutTemplateAssignmentRepository;
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
	private final WorkoutTemplateAssignmentRepository workoutTemplateAssignmentRepository;
	private final UserRepository userRepository;
	private final ExerciseRepository exerciseRepository;
	private final WorkoutTemplateMapper workoutTemplateMapper;

	@Transactional
	public WorkoutTemplateResponse create(CreateWorkoutTemplateRequest request) {
		return create(request, true);
	}

	@Transactional
	public WorkoutTemplateResponse createUnassigned(CreateWorkoutTemplateRequest request) {
		return create(request, false);
	}

	private WorkoutTemplateResponse create(CreateWorkoutTemplateRequest request, boolean assignToOwner) {
		User owner = userRepository.findById(request.getOwnerId())
				.orElseThrow(() -> new ResourceNotFoundException(
						"User " + request.getOwnerId() + " was not found"));
		String name = request.getName().trim();
		validateUniqueName(owner.getId(), name, null);
		Map<Long, Exercise> exercisesById = loadExercises(request.getExercises());
		validatePlan(request.getExercises(), exercisesById);

		WorkoutTemplate template = workoutTemplateRepository.saveAndFlush(WorkoutTemplate.builder()
				.owner(owner)
				.name(name)
				.description(request.getDescription())
				.position(nextPosition(owner.getId()))
				.build());
		replacePlan(template, request.getExercises(), exercisesById);
		if (assignToOwner) {
			workoutTemplateAssignmentRepository.saveAndFlush(WorkoutTemplateAssignment.builder()
					.workoutTemplate(template)
					.user(owner)
					.assignedBy(owner)
					.position(nextAssignmentPosition(owner.getId()))
					.build());
		}

		return loadResponse(template);
	}

	@Transactional
	public WorkoutTemplateResponse update(Long templateId, Long ownerId, UpdateWorkoutTemplateRequest request) {
		WorkoutTemplate template = findTemplateForOwner(templateId, ownerId);
		String name = request.getName().trim();
		validateUniqueName(template.getOwner().getId(), name, templateId);
		Map<Long, Exercise> exercisesById = loadExercises(request.getExercises());
		validatePlan(request.getExercises(), exercisesById);

		template.setName(name);
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

	public WorkoutTemplateResponse update(Long templateId, UpdateWorkoutTemplateRequest request) {
		return update(templateId, findTemplate(templateId).getOwner().getId(), request);
	}

	@Transactional(readOnly = true)
	public WorkoutTemplateResponse getById(Long templateId, Long ownerId) {
		WorkoutTemplate template = findTemplate(templateId);
		if (template.getOwner().getId().equals(ownerId)) {
			return loadResponse(template);
		}
		WorkoutTemplateAssignment assignment = workoutTemplateAssignmentRepository
				.findByWorkoutTemplate_IdAndUser_Id(templateId, ownerId)
				.orElseThrow(() -> new ResourceNotFoundException(
						"Workout template " + templateId + " was not found"));
		return loadAssignedResponse(assignment, ownerId);
	}

	@Transactional
	public WorkoutTemplateResponse duplicateUnassigned(Long templateId, Long ownerId) {
		WorkoutTemplate source = findTemplateForOwner(templateId, ownerId);
		List<WorkoutTemplateExercise> sourceExercises =
				workoutTemplateExerciseRepository.findAllByWorkoutTemplate_IdOrderByPositionAsc(templateId);
		List<Long> sourceExerciseIds = sourceExercises.stream()
				.map(WorkoutTemplateExercise::getId)
				.toList();
		Map<Long, List<WorkoutTemplateSet>> setsByExerciseId = sourceExerciseIds.isEmpty()
				? Map.of()
				: workoutTemplateSetRepository
						.findAllByTemplateExercise_IdInOrderByTemplateExercise_IdAscPositionAsc(sourceExerciseIds)
						.stream()
						.collect(Collectors.groupingBy(
								set -> set.getTemplateExercise().getId(),
								HashMap::new,
								Collectors.toList()));

		CreateWorkoutTemplateRequest request = CreateWorkoutTemplateRequest.builder()
				.ownerId(ownerId)
				.name(nextCopyName(ownerId, source.getName()))
				.description(source.getDescription())
				.exercises(sourceExercises.stream()
						.map(sourceExercise -> WorkoutTemplateExerciseRequest.builder()
								.exerciseId(sourceExercise.getExercise().getId())
								.notes(sourceExercise.getNotes())
								.sets(setsByExerciseId
										.getOrDefault(sourceExercise.getId(), List.of())
										.stream()
										.map(set -> WorkoutTemplateSetRequest.builder()
												.setType(set.getSetType())
												.targetReps(set.getTargetReps())
												.targetWeight(set.getTargetWeight())
												.targetTimeSeconds(set.getTargetTimeSeconds())
												.restSeconds(set.getRestSeconds())
												.build())
										.toList())
								.build())
						.toList())
				.build();
		return createUnassigned(request);
	}

	@Transactional
	public void delete(Long templateId, Long ownerId) {
		workoutTemplateRepository.delete(findTemplateForOwner(templateId, ownerId));
	}

	public void delete(Long templateId) {
		workoutTemplateRepository.delete(findTemplate(templateId));
	}

	@Transactional(readOnly = true)
	public List<WorkoutTemplateResponse> getByOwner(Long ownerId) {
		if (!userRepository.existsById(ownerId)) {
			throw new ResourceNotFoundException("User " + ownerId + " was not found");
		}
		return workoutTemplateRepository.findAllByOwner_IdOrderByPositionAscUpdatedAtDesc(ownerId).stream()
				.map(this::loadResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<WorkoutTemplateResponse> getAssignedTo(Long userId) {
		if (!userRepository.existsById(userId)) {
			throw new ResourceNotFoundException("User " + userId + " was not found");
		}
		return workoutTemplateAssignmentRepository
				.findAllByUser_IdOrderByPositionAscCreatedAtDesc(userId).stream()
				.map(assignment -> loadAssignedResponse(assignment, userId))
				.toList();
	}

	@Transactional
	public void assign(Long templateId, Long ownerId, Long assigneeId) {
		WorkoutTemplate template = findTemplateForOwner(templateId, ownerId);
		if (workoutTemplateAssignmentRepository.existsByWorkoutTemplate_IdAndUser_Id(
				templateId, assigneeId)) return;
		User assignee = userRepository.findById(assigneeId)
				.orElseThrow(() -> new ResourceNotFoundException("User " + assigneeId + " was not found"));
		workoutTemplateAssignmentRepository.saveAndFlush(WorkoutTemplateAssignment.builder()
				.workoutTemplate(template)
				.user(assignee)
				.assignedBy(template.getOwner())
				.position(nextAssignmentPosition(assigneeId))
				.build());
	}

	@Transactional
	public void unassign(Long templateId, Long ownerId, Long assigneeId) {
		findTemplateForOwner(templateId, ownerId);
		workoutTemplateAssignmentRepository.findByWorkoutTemplate_IdAndUser_Id(templateId, assigneeId)
				.ifPresent(workoutTemplateAssignmentRepository::delete);
	}

	@Transactional(readOnly = true)
	public List<WorkoutTemplateAssignment> getAssignments(Long templateId, Long ownerId) {
		findTemplateForOwner(templateId, ownerId);
		return workoutTemplateAssignmentRepository
				.findAllByWorkoutTemplate_IdOrderByCreatedAtAsc(templateId);
	}

	@Transactional
	public void reorder(ReorderWorkoutTemplatesRequest request) {
		if (!userRepository.existsById(request.getOwnerId())) {
			throw new ResourceNotFoundException("User " + request.getOwnerId() + " was not found");
		}
		List<WorkoutTemplateAssignment> assignments = workoutTemplateAssignmentRepository
				.findAllByUser_IdOrderByPositionAscCreatedAtDesc(request.getOwnerId());
		List<Long> requestedIds = request.getTemplateIds();
		if (requestedIds.size() != assignments.size()
				|| new LinkedHashSet<>(requestedIds).size() != requestedIds.size()
				|| !new LinkedHashSet<>(assignments.stream()
						.map(assignment -> assignment.getWorkoutTemplate().getId()).toList())
						.equals(new LinkedHashSet<>(requestedIds))) {
			throw new InvalidRequestException(
					"Template order must contain every template owned by user " + request.getOwnerId()
							+ " exactly once");
		}

		Map<Long, WorkoutTemplateAssignment> assignmentsByTemplateId = assignments.stream()
				.collect(Collectors.toMap(
						assignment -> assignment.getWorkoutTemplate().getId(), Function.identity()));
		for (int position = 0; position < requestedIds.size(); position++) {
			assignmentsByTemplateId.get(requestedIds.get(position)).setPosition(position);
		}
		workoutTemplateAssignmentRepository.saveAll(assignments);
		workoutTemplateAssignmentRepository.flush();
	}

	private int nextPosition(Long ownerId) {
		return workoutTemplateRepository.findAllByOwner_IdOrderByPositionAscUpdatedAtDesc(ownerId).stream()
				.map(WorkoutTemplate::getPosition)
				.filter(java.util.Objects::nonNull)
				.max(Integer::compareTo)
				.orElse(-1) + 1;
	}

	private int nextAssignmentPosition(Long userId) {
		return workoutTemplateAssignmentRepository
				.findAllByUser_IdOrderByPositionAscCreatedAtDesc(userId).stream()
				.map(WorkoutTemplateAssignment::getPosition)
				.filter(java.util.Objects::nonNull)
				.max(Integer::compareTo)
				.orElse(-1) + 1;
	}

	private WorkoutTemplate findTemplate(Long templateId) {
		return workoutTemplateRepository.findById(templateId)
				.orElseThrow(() -> new ResourceNotFoundException(
						"Workout template " + templateId + " was not found"));
	}

	private WorkoutTemplate findTemplateForOwner(Long templateId, Long ownerId) {
		WorkoutTemplate template = findTemplate(templateId);
		if (!template.getOwner().getId().equals(ownerId)) {
			throw new ResourceNotFoundException("Workout template " + templateId + " was not found");
		}
		return template;
	}

	private void validateUniqueName(Long ownerId, String name, Long excludedTemplateId) {
		boolean alreadyExists = excludedTemplateId == null
				? workoutTemplateRepository.existsByOwner_IdAndNameIgnoreCase(ownerId, name)
				: workoutTemplateRepository.existsByOwner_IdAndNameIgnoreCaseAndIdNot(
						ownerId, name, excludedTemplateId);
		if (alreadyExists) {
			throw new InvalidRequestException(
					"Workout template name '" + name + "' is already in use for this user");
		}
	}

	private String nextCopyName(Long ownerId, String sourceName) {
		int copyNumber = 1;
		while (true) {
			String suffix = copyNumber == 1 ? " Copy" : " Copy " + copyNumber;
			String base = sourceName.substring(0, Math.min(sourceName.length(), 100 - suffix.length())).stripTrailing();
			String candidate = base + suffix;
			if (!workoutTemplateRepository.existsByOwner_IdAndNameIgnoreCase(ownerId, candidate)) {
				return candidate;
			}
			copyNumber++;
		}
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

	private WorkoutTemplateResponse loadAssignedResponse(
			WorkoutTemplateAssignment assignment, Long userId) {
		WorkoutTemplateResponse response = loadResponse(assignment.getWorkoutTemplate());
		response.setPosition(assignment.getPosition());
		response.setEditable(assignment.getWorkoutTemplate().getOwner().getId().equals(userId));
		return response;
	}
}
