package com.fazariadis.strengthcoach.service;

import com.fazariadis.strengthcoach.dto.UserResponse;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.exception.ResourceNotFoundException;
import com.fazariadis.strengthcoach.mapper.UserMapper;
import com.fazariadis.strengthcoach.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class UserService {

	private final UserRepository userRepository;
	private final UserMapper userMapper;

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
					user.setAccountType(accountType);
					return userMapper.toResponse(userRepository.save(user));
				})
				.orElseThrow(() -> new ResourceNotFoundException(
						"User " + userId + " was not found"));
	}
}
