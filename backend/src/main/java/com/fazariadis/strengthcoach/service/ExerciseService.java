package com.fazariadis.strengthcoach.service;

import com.fazariadis.strengthcoach.dto.ExerciseResponse;
import com.fazariadis.strengthcoach.mapper.ExerciseMapper;
import com.fazariadis.strengthcoach.repository.ExerciseRepository;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class ExerciseService {

	private final ExerciseRepository exerciseRepository;
	private final ExerciseMapper exerciseMapper;

	@Transactional(readOnly = true)
	public List<ExerciseResponse> getAllExercises() {
		return exerciseRepository.findAllByOrderByNameAsc().stream()
				.map(exerciseMapper::toResponse)
				.toList();
	}
}
