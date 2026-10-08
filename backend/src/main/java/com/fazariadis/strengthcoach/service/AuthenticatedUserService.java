package com.fazariadis.strengthcoach.service;

import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.exception.InvalidRequestException;
import com.fazariadis.strengthcoach.repository.UserRepository;
import java.util.Map;
import lombok.AllArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class AuthenticatedUserService {
	private final UserRepository userRepository;

	@Transactional
	public User resolve(Jwt jwt) {
		String subject = jwt.getSubject();
		String email = jwt.getClaimAsString("email");
		if (subject == null || subject.isBlank() || email == null || email.isBlank()) {
			throw new InvalidRequestException("The authenticated account is missing a subject or email");
		}
		return userRepository.findByAuthSubject(subject).orElseGet(() ->
				userRepository.findByEmailIgnoreCase(email).map(existing -> {
					existing.setAuthSubject(subject);
					return userRepository.save(existing);
				}).orElseGet(() -> userRepository.save(User.builder()
						.authSubject(subject)
						.email(email)
						.displayName(resolveDisplayName(jwt, email))
						.accountType(AccountType.INDIVIDUAL)
						.build())));
	}

	private String resolveDisplayName(Jwt jwt, String email) {
		Map<String, Object> metadata = jwt.getClaim("user_metadata");
		if (metadata != null) {
			Object name = metadata.get("full_name");
			if (name instanceof String value && !value.isBlank()) return value.substring(0, Math.min(value.length(), 100));
		}
		return email.substring(0, Math.min(email.indexOf('@') > 0 ? email.indexOf('@') : email.length(), 100));
	}
}
