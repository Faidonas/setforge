package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.WorkoutTemplate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutTemplateRepository extends JpaRepository<WorkoutTemplate, Long> {

	List<WorkoutTemplate> findAllByOwner_IdOrderByUpdatedAtDesc(Long ownerId);
}
