package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.WorkoutTemplate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutTemplateRepository extends JpaRepository<WorkoutTemplate, Long> {

	boolean existsByOwner_IdAndNameIgnoreCase(Long ownerId, String name);

	boolean existsByOwner_IdAndNameIgnoreCaseAndIdNot(Long ownerId, String name, Long templateId);

	List<WorkoutTemplate> findAllByOwner_IdOrderByPositionAscUpdatedAtDesc(Long ownerId);
}
