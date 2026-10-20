package com.fazariadis.strengthcoach.service;

import com.fazariadis.strengthcoach.dto.CreateCoachUserResponse;
import com.fazariadis.strengthcoach.dto.CompleteOnboardingRequest;
import com.fazariadis.strengthcoach.dto.UserResponse;
import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.entity.enums.ThemePreference;
import com.fazariadis.strengthcoach.exception.ForbiddenOperationException;
import com.fazariadis.strengthcoach.exception.InvalidRequestException;
import com.fazariadis.strengthcoach.exception.ResourceNotFoundException;
import com.fazariadis.strengthcoach.mapper.UserMapper;
import com.fazariadis.strengthcoach.repository.UserRepository;
import java.util.Locale;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Slf4j
public class UserService {

	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final CoachAccessPolicy coachAccessPolicy;
	private final SupabaseAdminService supabaseAdminService;

	@Transactional(readOnly = true)
	public UserResponse getUser(long userId) {
		return userRepository.findById(userId)
				.map(userMapper::toResponse)
				.orElseThrow(() -> new ResourceNotFoundException(
						"User " + userId + " was not found"));
	}

	@Transactional
	public UserResponse updateAccountType(long userId, AccountType accountType) {
		return userRepository.findById(userId)
				.map(user -> {
					if (accountType != user.getAccountType()
							&& (coachAccessPolicy.hasAccess(accountType)
									|| coachAccessPolicy.hasAccess(user.getAccountType()))) {
						throw new ForbiddenOperationException(
								"Admin and trainer roles must be assigned manually");
					}
					user.setAccountType(accountType);
					user.setOnboardingCompleted(true);
					return userMapper.toResponse(userRepository.save(user));
				})
				.orElseThrow(() -> new ResourceNotFoundException(
						"User " + userId + " was not found"));
	}

	@Transactional
	public UserResponse completeOnboarding(long userId, CompleteOnboardingRequest request) {
		return userRepository.findById(userId)
				.map(user -> {
					user.setDisplayName(request.getDisplayName().trim());
					user.setUnitSystem(request.getUnitSystem());
					user.setPrimaryObjective(request.getPrimaryObjective());
					user.setLiftingExperience(request.getLiftingExperience());
					user.setOnboardingCompleted(true);
					return userMapper.toResponse(userRepository.save(user));
				})
				.orElseThrow(() -> new ResourceNotFoundException(
						"User " + userId + " was not found"));
	}

	@Transactional
	public UserResponse updateThemePreference(long userId, ThemePreference themePreference) {
		return userRepository.findById(userId)
				.map(user -> {
					user.setThemePreference(themePreference);
					return userMapper.toResponse(userRepository.save(user));
				})
				.orElseThrow(() -> new ResourceNotFoundException(
						"User " + userId + " was not found"));
	}

	@Transactional
	public CreateCoachUserResponse createCoach(
			User admin, String email, String displayName, String temporaryPassword) {
		coachAccessPolicy.requireAdmin(admin);
		String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
		String normalizedDisplayName = displayName.trim();
		String maskedEmail = maskEmail(normalizedEmail);
		log.info("area=coach-dashboard action=create-coach event=start actorUserId={} targetEmail={}",
				admin.getId(), maskedEmail);
		User existing = userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
		if (existing != null && existing.getAccountType() == AccountType.ADMIN) {
			log.warn("area=coach-dashboard action=create-coach event=rejected actorUserId={} targetUserId={} reason=already-admin",
					admin.getId(), existing.getId());
			throw new InvalidRequestException("This account is already an administrator");
		}
		if (existing != null && existing.getAccountType() == AccountType.PERSONAL_TRAINER) {
			log.warn("area=coach-dashboard action=create-coach event=rejected actorUserId={} targetUserId={} reason=already-coach",
					admin.getId(), existing.getId());
			throw new InvalidRequestException("This account is already a coach");
		}
		if (existing != null && existing.getAuthSubject() != null) {
			existing.setDisplayName(normalizedDisplayName);
			existing.setAccountType(AccountType.PERSONAL_TRAINER);
			existing.setOnboardingCompleted(true);
			User savedCoach = userRepository.save(existing);
			log.info("area=coach-dashboard action=create-coach event=promoted actorUserId={} coachUserId={} supabaseUserCreated=false",
					admin.getId(), savedCoach.getId());
			return CreateCoachUserResponse.builder()
					.coach(userMapper.toResponse(savedCoach))
					.supabaseUserCreated(false)
					.build();
		}

		SupabaseAdminService.SupabaseAdminUser authUser = supabaseAdminService.createUser(
				normalizedEmail, temporaryPassword, normalizedDisplayName);
		try {
			User coach = existing != null ? existing : User.builder().email(normalizedEmail).build();
			coach.setAuthSubject(authUser.id());
			coach.setDisplayName(normalizedDisplayName);
			coach.setAccountType(AccountType.PERSONAL_TRAINER);
			coach.setOnboardingCompleted(true);
			User savedCoach = userRepository.saveAndFlush(coach);
			log.info("area=coach-dashboard action=create-coach event=success actorUserId={} coachUserId={} supabaseUserId={} supabaseUserCreated=true",
					admin.getId(), savedCoach.getId(), authUser.id());
			return CreateCoachUserResponse.builder()
					.coach(userMapper.toResponse(savedCoach))
					.supabaseUserCreated(true)
					.build();
		} catch (RuntimeException exception) {
			log.error("area=coach-dashboard action=create-coach event=local-save-failure actorUserId={} targetEmail={} supabaseUserId={} errorType={}",
					admin.getId(), maskedEmail, authUser.id(), exception.getClass().getSimpleName(), exception);
			supabaseAdminService.deleteUserQuietly(authUser.id());
			throw exception;
		}
	}

	private String maskEmail(String email) {
		int separator = email.indexOf('@');
		if (separator <= 0) return "***";
		return email.charAt(0) + "***" + email.substring(separator);
	}
}
