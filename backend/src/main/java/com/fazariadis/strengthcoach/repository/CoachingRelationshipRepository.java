package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.CoachingRelationship;
import com.fazariadis.strengthcoach.entity.enums.CoachingStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoachingRelationshipRepository extends JpaRepository<CoachingRelationship, Long> {

	List<CoachingRelationship> findAllByClient_IdAndStatusOrderByCreatedAtDesc(
			Long clientId, CoachingStatus status);

	List<CoachingRelationship> findAllByTrainer_IdAndStatusOrderByCreatedAtDesc(
			Long trainerId, CoachingStatus status);

	boolean existsByTrainer_IdAndClient_IdAndStatusIn(
			Long trainerId, Long clientId, Collection<CoachingStatus> statuses);

	Optional<CoachingRelationship> findFirstByTrainer_IdAndClient_IdOrderByCreatedAtDesc(
			Long trainerId, Long clientId);
}
