package com.fazariadis.strengthcoach.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fazariadis.strengthcoach.dto.UserResponse;
import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.exception.ResourceNotFoundException;
import com.fazariadis.strengthcoach.mapper.UserMapper;
import com.fazariadis.strengthcoach.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class UserServiceTests {

	private final UserRepository userRepository = mock(UserRepository.class);
	private final UserMapper userMapper = mock(UserMapper.class);
	private final UserService userService = new UserService(userRepository, userMapper);

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
}
