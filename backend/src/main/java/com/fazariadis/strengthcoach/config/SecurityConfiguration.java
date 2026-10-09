package com.fazariadis.strengthcoach.config;

import java.net.URI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

@Configuration
public class SecurityConfiguration {
	@Bean
	JwtDecoder jwtDecoder(
			@Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuer,
			@Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri,
			@Value("${setforge.auth.audience:authenticated}") String audience) {
		String normalizedIssuer = normalizeIssuer(issuer);
		String normalizedJwkSetUri = normalizeJwkSetUri(jwkSetUri);
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(normalizedJwkSetUri)
				.jwsAlgorithm(SignatureAlgorithm.ES256)
				.build();
		OAuth2TokenValidator<Jwt> audienceValidator = jwt -> jwt.getAudience().contains(audience)
				? OAuth2TokenValidatorResult.success()
				: OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Required audience is missing", null));
		decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
				JwtValidators.createDefaultWithIssuer(normalizedIssuer), audienceValidator));
		return decoder;
	}

	private String normalizeIssuer(String value) {
		URI uri = URI.create(value);
		String path = uri.getPath();
		if (path == null || path.isBlank() || path.equals("/")) {
			return stripTrailingSlash(value) + "/auth/v1";
		}
		return stripTrailingSlash(value);
	}

	private String normalizeJwkSetUri(String value) {
		URI uri = URI.create(value);
		String path = uri.getPath();
		String normalized = stripTrailingSlash(value);
		if (path == null || path.isBlank() || path.equals("/")) {
			return normalized + "/auth/v1/.well-known/jwks.json";
		}
		if (normalized.endsWith("/auth/v1")) {
			return normalized + "/.well-known/jwks.json";
		}
		return normalized;
	}

	private String stripTrailingSlash(String value) {
		return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
				.cors(Customizer.withDefaults())
				.csrf(csrf -> csrf.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/actuator/health", "/exercise-media/**", "/v3/api-docs/**", "/swagger-ui/**").permitAll()
						.anyRequest().authenticated())
				.oauth2ResourceServer(resourceServer -> resourceServer.jwt(Customizer.withDefaults()))
				.build();
	}
}
