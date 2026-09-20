package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.WorkoutTemplateSet;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutTemplateSetRepository extends JpaRepository<WorkoutTemplateSet, Long> {

	List<WorkoutTemplateSet> findAllByTemplateExercise_IdOrderByPositionAsc(Long templateExerciseId);
}
