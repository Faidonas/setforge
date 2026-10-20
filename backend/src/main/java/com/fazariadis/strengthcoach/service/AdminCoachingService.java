package com.fazariadis.strengthcoach.service;

import com.fazariadis.strengthcoach.dto.AdminCoachingRelationshipResponse;
import com.fazariadis.strengthcoach.dto.CreateCoachingRelationshipRequest;
import com.fazariadis.strengthcoach.dto.UserResponse;
import com.fazariadis.strengthcoach.entity.CoachingRelationship;
import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.entity.enums.CoachingStatus;
import com.fazariadis.strengthcoach.exception.InvalidRequestException;
import com.fazariadis.strengthcoach.exception.ResourceNotFoundException;
import com.fazariadis.strengthcoach.mapper.UserMapper;
import com.fazariadis.strengthcoach.repository.CoachingRelationshipRepository;
import com.fazariadis.strengthcoach.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Slf4j
public class AdminCoachingService {

	private final UserRepository userRepository;
	private final CoachingRelationshipRepository relationshipRepository;
	private final SupabaseAdminService supabaseAdminService;
	private final CoachAccessPolicy coachAccessPolicy;
	private final UserMapper userMapper;

	@Transactional(readOnly = true)
	public List<UserResponse> getAssignableCoaches(User admin) {
		coachAccessPolicy.requireAdmin(admin);
		return userRepository.findAllByAccountTypeInOrderByDisplayNameAsc(
				List.of(AccountType.ADMIN, AccountType.PERSONAL_TRAINER)).stream()
				.map(userMapper::toResponse)
				.toList();
	}

	@Transactional
	public AdminCoachingRelationshipResponse assignClient(
			User admin, CreateCoachingRelationshipRequest request) {
		coachAccessPolicy.requireAdmin(admin);
		String clientEmail = request.getClientEmail().trim().toLowerCase(Locale.ROOT);
		User coach = userRepository.findById(request.getCoachId())
				.orElseThrow(() -> new ResourceNotFoundException(
						"Coach " + request.getCoachId() + " was not found"));
		if (!coachAccessPolicy.hasAccess(coach.getAccountType())) {
			throw new InvalidRequestException("The selected account is not a coach");
		}

		User client = userRepository.findByEmailIgnoreCase(clientEmail)
				.orElseGet(() -> importIndividual(clientEmail));
		if (client.getAccountType() != AccountType.INDIVIDUAL) {
			throw new InvalidRequestException("The client must have an individual account");
		}

		Instant now = Instant.now();
		CoachingRelationship relationship = relationshipRepository
				.findFirstByTrainer_IdAndClient_IdOrderByCreatedAtDesc(coach.getId(), client.getId())
				.orElseGet(() -> CoachingRelationship.builder()
						.trainer(coach)
						.client(client)
						.build());
		relationship.setStatus(CoachingStatus.ACTIVE);
		relationship.setStartedAt(now);
		relationship.setEndedAt(null);
		CoachingRelationship saved = relationshipRepository.saveAndFlush(relationship);

		log.info("area=coach-dashboard action=assign-client event=success actorUserId={} coachUserId={} clientUserId={} relationshipId={}",
				admin.getId(), coach.getId(), client.getId(), saved.getId());
		return AdminCoachingRelationshipResponse.builder()
				.relationshipId(saved.getId())
				.coachId(coach.getId())
				.coachName(coach.getDisplayName())
				.clientId(client.getId())
				.clientName(client.getDisplayName())
				.clientEmail(client.getEmail())
				.status(saved.getStatus())
				.startedAt(saved.getStartedAt())
				.build();
	}

	private User importIndividual(String email) {
		SupabaseAdminService.SupabaseAdminUser authUser = supabaseAdminService.findUserByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException(
						"No Supabase account exists for " + email));
		String displayName = displayName(authUser.userMetadata(), email);
		User imported = userRepository.saveAndFlush(User.builder()
				.authSubject(authUser.id())
				.email(email)
				.displayName(displayName)
				.accountType(AccountType.INDIVIDUAL)
				.build());
		log.info("area=coach-dashboard action=import-client event=success clientUserId={} supabaseUserId={}",
				imported.getId(), authUser.id());
		return imported;
	}

	private String displayName(Map<String, Object> metadata, String email) {
		if (metadata != null) {
			Object fullName = metadata.get("full_name");
			if (fullName instanceof String value && !value.isBlank()) {
				return value.substring(0, Math.min(value.length(), 100));
			}
		}
		String fallback = email.substring(0, email.indexOf('@'));
		return fallback.substring(0, Math.min(fallback.length(), 100));
	}
}
