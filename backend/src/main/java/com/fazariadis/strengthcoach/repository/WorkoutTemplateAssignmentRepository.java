package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.WorkoutTemplateAssignment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutTemplateAssignmentRepository
		extends JpaRepository<WorkoutTemplateAssignment, Long> {

	List<WorkoutTemplateAssignment> findAllByUser_IdOrderByPositionAscCreatedAtDesc(Long userId);

	List<WorkoutTemplateAssignment> findAllByWorkoutTemplate_IdOrderByCreatedAtAsc(Long templateId);

	Optional<WorkoutTemplateAssignment> findByWorkoutTemplate_IdAndUser_Id(Long templateId, Long userId);

	boolean existsByWorkoutTemplate_IdAndUser_Id(Long templateId, Long userId);

	long countByUser_Id(Long userId);
}
