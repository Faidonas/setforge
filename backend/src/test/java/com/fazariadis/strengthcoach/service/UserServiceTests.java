package com.fazariadis.strengthcoach.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fazariadis.strengthcoach.dto.CreateCoachUserResponse;
import com.fazariadis.strengthcoach.dto.UserResponse;
import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.exception.ForbiddenOperationException;
import com.fazariadis.strengthcoach.exception.ResourceNotFoundException;
import com.fazariadis.strengthcoach.mapper.UserMapper;
import com.fazariadis.strengthcoach.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class UserServiceTests {

	private final UserRepository userRepository = mock(UserRepository.class);
	private final UserMapper userMapper = mock(UserMapper.class);
	private final CoachAccessPolicy coachAccessPolicy = new CoachAccessPolicy();
	private final SupabaseAdminService supabaseAdminService = mock(SupabaseAdminService.class);
	private final UserService userService = new UserService(
			userRepository, userMapper, coachAccessPolicy, supabaseAdminService);

	@Test
	void getUserMapsTheStoredUser() {
		User user = User.builder().id(1L).displayName("Alex Trainer").build();
		UserResponse response = UserResponse.builder().id(1L).displayName("Alex Trainer").build();
		when(userRepository.findById(1L)).thenReturn(Optional.of(user));
		when(userMapper.toResponse(user)).thenReturn(response);

		assertThat(userService.getUser(1L)).isSameAs(response);
	}

	@Test
	void getUserRejectsUnknownUser() {
		when(userRepository.findById(99L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> userService.getUser(99L))
				.isInstanceOf(ResourceNotFoundException.class)
				.hasMessage("User 99 was not found");
	}

	@Test
	void updateAccountTypeRejectsSelfPromotionToTrainer() {
		User user = User.builder().id(9L).accountType(AccountType.INDIVIDUAL).build();
		when(userRepository.findById(9L)).thenReturn(Optional.of(user));

		assertThatThrownBy(() -> userService.updateAccountType(9L, AccountType.PERSONAL_TRAINER))
				.isInstanceOf(ForbiddenOperationException.class)
				.hasMessage("Admin and trainer roles must be assigned manually");
	}

	@Test
	void updateAccountTypeDoesNotLetAnAdminDowngradeThroughOnboarding() {
		User admin = User.builder().id(10L).accountType(AccountType.ADMIN).build();
		when(userRepository.findById(10L)).thenReturn(Optional.of(admin));

		assertThatThrownBy(() -> userService.updateAccountType(10L, AccountType.INDIVIDUAL))
				.isInstanceOf(ForbiddenOperationException.class)
				.hasMessage("Admin and trainer roles must be assigned manually");
	}

	@Test
	void completingIndividualOnboardingIsPersisted() {
		User user = User.builder().id(9L).accountType(AccountType.INDIVIDUAL).build();
		when(userRepository.findById(9L)).thenReturn(Optional.of(user));
		when(userRepository.save(user)).thenReturn(user);
		when(userMapper.toResponse(user)).thenAnswer(invocation -> UserResponse.builder()
				.id(user.getId())
				.accountType(user.getAccountType())
				.onboardingCompleted(user.isOnboardingCompleted())
				.build());

		UserResponse response = userService.updateAccountType(9L, AccountType.INDIVIDUAL);

		assertThat(user.isOnboardingCompleted()).isTrue();
		assertThat(response.isOnboardingCompleted()).isTrue();
	}

	@Test
	void adminCanCreateAPreparedCoachAccount() {
		User admin = User.builder().id(10L).accountType(AccountType.ADMIN).build();
		when(userRepository.findByEmailIgnoreCase("coach@example.com")).thenReturn(Optional.empty());
		when(supabaseAdminService.createUser("coach@example.com", "temporary-password", "New Coach"))
				.thenReturn(new SupabaseAdminService.SupabaseAdminUser("auth-user-12", "coach@example.com"));
		when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
		when(userMapper.toResponse(any(User.class))).thenAnswer(invocation -> {
			User saved = invocation.getArgument(0);
			return UserResponse.builder()
					.email(saved.getEmail())
					.displayName(saved.getDisplayName())
					.accountType(saved.getAccountType())
					.onboardingCompleted(saved.isOnboardingCompleted())
					.build();
		});

		CreateCoachUserResponse result = userService.createCoach(
				admin, " Coach@Example.com ", " New Coach ", "temporary-password");
		UserResponse response = result.getCoach();

		assertThat(result.isSupabaseUserCreated()).isTrue();
		assertThat(response.getEmail()).isEqualTo("coach@example.com");
		assertThat(response.getDisplayName()).isEqualTo("New Coach");
		assertThat(response.getAccountType()).isEqualTo(AccountType.PERSONAL_TRAINER);
		assertThat(response.isOnboardingCompleted()).isTrue();
	}

	@Test
	void adminCanPromoteAnExistingIndividualToCoach() {
		User admin = User.builder().id(10L).accountType(AccountType.ADMIN).build();
		User existing = User.builder().id(12L).email("member@example.com")
				.authSubject("existing-auth-user").displayName("Member")
				.accountType(AccountType.INDIVIDUAL).build();
		when(userRepository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(existing));
		when(userRepository.save(existing)).thenReturn(existing);
		when(userMapper.toResponse(existing)).thenReturn(UserResponse.builder()
				.id(12L).accountType(AccountType.PERSONAL_TRAINER).build());

		CreateCoachUserResponse result = userService.createCoach(
				admin, "member@example.com", "Coach Member", "temporary-password");
		UserResponse response = result.getCoach();

		assertThat(result.isSupabaseUserCreated()).isFalse();
		assertThat(response.getAccountType()).isEqualTo(AccountType.PERSONAL_TRAINER);
		assertThat(existing.getDisplayName()).isEqualTo("Coach Member");
		assertThat(existing.isOnboardingCompleted()).isTrue();
	}

	@Test
	void nonAdminCannotCreateCoachAccounts() {
		User trainer = User.builder().id(11L).accountType(AccountType.PERSONAL_TRAINER).build();

		assertThatThrownBy(() -> userService.createCoach(
				trainer, "coach@example.com", "Coach", "temporary-password"))
				.isInstanceOf(ForbiddenOperationException.class)
				.hasMessage("Administrator access is required");
	}
}
