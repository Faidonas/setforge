package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.Exercise;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

	List<Exercise> findAllByOrderByNameAsc();
}
