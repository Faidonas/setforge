package com.fazariadis.strengthcoach.service;

import com.fazariadis.strengthcoach.dto.ExerciseResponse;
import com.fazariadis.strengthcoach.mapper.ExerciseMapper;
import com.fazariadis.strengthcoach.repository.ExerciseRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExerciseService {

	private final ExerciseRepository exerciseRepository;
	private final ExerciseMapper exerciseMapper;

	public ExerciseService(ExerciseRepository exerciseRepository, ExerciseMapper exerciseMapper) {
		this.exerciseRepository = exerciseRepository;
		this.exerciseMapper = exerciseMapper;
	}

	@Transactional(readOnly = true)
	public List<ExerciseResponse> getAllExercises() {
		return exerciseRepository.findAllByOrderByNameAsc().stream()
				.map(exerciseMapper::toResponse)
				.toList();
	}
}
