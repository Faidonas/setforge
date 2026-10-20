package com.fazariadis.strengthcoach.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fazariadis.strengthcoach.dto.AdminCoachingRelationshipResponse;
import com.fazariadis.strengthcoach.dto.CreateCoachingRelationshipRequest;
import com.fazariadis.strengthcoach.entity.CoachingRelationship;
import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.entity.enums.CoachingStatus;
import com.fazariadis.strengthcoach.exception.ForbiddenOperationException;
import com.fazariadis.strengthcoach.mapper.UserMapper;
import com.fazariadis.strengthcoach.repository.CoachingRelationshipRepository;
import com.fazariadis.strengthcoach.repository.UserRepository;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class AdminCoachingServiceTests {

	private final UserRepository userRepository = mock(UserRepository.class);
	private final CoachingRelationshipRepository relationshipRepository =
			mock(CoachingRelationshipRepository.class);
	private final SupabaseAdminService supabaseAdminService = mock(SupabaseAdminService.class);
	private final CoachAccessPolicy coachAccessPolicy = new CoachAccessPolicy();
	private final UserMapper userMapper = mock(UserMapper.class);
	private final AdminCoachingService service = new AdminCoachingService(
			userRepository,
			relationshipRepository,
			supabaseAdminService,
			coachAccessPolicy,
			userMapper);

	@Test
	void adminCanImportSupabaseIndividualAndAssignCoach() {
		User admin = User.builder().id(10L).accountType(AccountType.ADMIN).build();
		User coach = User.builder().id(11L).displayName("Test Coach")
				.accountType(AccountType.PERSONAL_TRAINER).build();
		when(userRepository.findById(11L)).thenReturn(Optional.of(coach));
		when(userRepository.findByEmailIgnoreCase("individual@example.com"))
				.thenReturn(Optional.empty());
		when(supabaseAdminService.findUserByEmail("individual@example.com"))
				.thenReturn(Optional.of(new SupabaseAdminService.SupabaseAdminUser(
						"auth-user-12", "individual@example.com", Map.of("full_name", "New Client"))));
		when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
			User user = invocation.getArgument(0);
			user.setId(12L);
			return user;
		});
		when(relationshipRepository.findFirstByTrainer_IdAndClient_IdOrderByCreatedAtDesc(11L, 12L))
				.thenReturn(Optional.empty());
		when(relationshipRepository.saveAndFlush(any(CoachingRelationship.class)))
				.thenAnswer(invocation -> {
					CoachingRelationship relationship = invocation.getArgument(0);
					relationship.setId(7L);
					return relationship;
				});

		AdminCoachingRelationshipResponse response = service.assignClient(
				admin, new CreateCoachingRelationshipRequest(" Individual@Example.com ", 11L));

		assertThat(response.getRelationshipId()).isEqualTo(7L);
		assertThat(response.getClientName()).isEqualTo("New Client");
		assertThat(response.getStatus()).isEqualTo(CoachingStatus.ACTIVE);
		verify(supabaseAdminService).findUserByEmail("individual@example.com");
	}

	@Test
	void endedRelationshipIsReactivatedInsteadOfDuplicated() {
		User admin = User.builder().id(10L).accountType(AccountType.ADMIN).build();
		User coach = User.builder().id(11L).displayName("Test Coach")
				.accountType(AccountType.PERSONAL_TRAINER).build();
		User client = User.builder().id(12L).email("individual@example.com")
				.displayName("Client").accountType(AccountType.INDIVIDUAL).build();
		CoachingRelationship existing = CoachingRelationship.builder()
				.id(7L).trainer(coach).client(client).status(CoachingStatus.ENDED).build();
		when(userRepository.findById(11L)).thenReturn(Optional.of(coach));
		when(userRepository.findByEmailIgnoreCase("individual@example.com"))
				.thenReturn(Optional.of(client));
		when(relationshipRepository.findFirstByTrainer_IdAndClient_IdOrderByCreatedAtDesc(11L, 12L))
				.thenReturn(Optional.of(existing));
		when(relationshipRepository.saveAndFlush(existing)).thenReturn(existing);

		service.assignClient(admin, new CreateCoachingRelationshipRequest(
				"individual@example.com", 11L));

		assertThat(existing.getStatus()).isEqualTo(CoachingStatus.ACTIVE);
		assertThat(existing.getStartedAt()).isNotNull();
		assertThat(existing.getEndedAt()).isNull();
	}

	@Test
	void trainerCannotUseAdminRelationshipManagement() {
		User trainer = User.builder().id(11L).accountType(AccountType.PERSONAL_TRAINER).build();

		assertThatThrownBy(() -> service.assignClient(
				trainer, new CreateCoachingRelationshipRequest("individual@example.com", 11L)))
				.isInstanceOf(ForbiddenOperationException.class)
				.hasMessage("Administrator access is required");
	}
}
