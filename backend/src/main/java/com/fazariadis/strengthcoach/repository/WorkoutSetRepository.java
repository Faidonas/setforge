package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.WorkoutSet;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutSetRepository extends JpaRepository<WorkoutSet, Long> {

	List<WorkoutSet> findAllBySessionExercise_IdOrderByPositionAsc(Long sessionExerciseId);
}
