package com.fazariadis.strengthcoach.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fazariadis.strengthcoach.exception.InvalidRequestException;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Service
@Slf4j
public class SupabaseAdminService {

	private final RestClient restClient;
	private final boolean configured;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public SupabaseAdminService(
			@Value("${setforge.supabase.url:}") String supabaseUrl,
			@Value("${setforge.supabase.admin-key:}") String adminKey) {
		this.configured = !supabaseUrl.isBlank() && !adminKey.isBlank();
		RestClient.Builder builder = RestClient.builder()
				.baseUrl(stripTrailingSlash(supabaseUrl))
				.defaultHeader("apikey", adminKey);
		if (!adminKey.startsWith("sb_secret_")) {
			builder.defaultHeader("Authorization", "Bearer " + adminKey);
		}
		this.restClient = builder.build();
		log.info("integration=supabase-auth event=configuration status={} keyType={}",
				configured ? "ready" : "missing", keyType(adminKey));
	}

	public SupabaseAdminUser createUser(String email, String password, String displayName) {
		requireConfigured();
		long startedAt = System.nanoTime();
		String maskedEmail = maskEmail(email);
		log.info("integration=supabase-auth operation=create-user event=start email={}", maskedEmail);
		try {
			SupabaseAdminUser user = restClient.post()
					.uri("/auth/v1/admin/users")
					.body(new CreateUserPayload(
							email, password, true, Map.of("full_name", displayName)))
					.retrieve()
					.body(SupabaseAdminUser.class);
			if (user == null || user.id() == null || user.id().isBlank()) {
				log.warn("integration=supabase-auth operation=create-user event=invalid-response email={} durationMs={}",
						maskedEmail, elapsedMillis(startedAt));
				throw new InvalidRequestException("Supabase returned an invalid user response");
			}
			log.info("integration=supabase-auth operation=create-user event=success email={} supabaseUserId={} durationMs={}",
					maskedEmail, user.id(), elapsedMillis(startedAt));
			return user;
		} catch (RestClientResponseException exception) {
			String message = formatSupabaseError(exception);
			log.warn("integration=supabase-auth operation=create-user event=http-failure email={} status={} durationMs={} reason={}",
					maskedEmail, exception.getStatusCode().value(), elapsedMillis(startedAt), message);
			throw new InvalidRequestException(message);
		} catch (RestClientException exception) {
			log.error("integration=supabase-auth operation=create-user event=transport-failure email={} durationMs={} errorType={}",
					maskedEmail, elapsedMillis(startedAt), exception.getClass().getSimpleName(), exception);
			throw new InvalidRequestException("Supabase Auth is currently unavailable");
		}
	}

	public Optional<SupabaseAdminUser> findUserByEmail(String email) {
		requireConfigured();
		long startedAt = System.nanoTime();
		String maskedEmail = maskEmail(email);
		log.info("integration=supabase-auth operation=find-user event=start email={}", maskedEmail);
		try {
			SupabaseUserList response = restClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/auth/v1/admin/users")
							.queryParam("page", 1)
							.queryParam("per_page", 1000)
							.build())
					.retrieve()
					.body(SupabaseUserList.class);
			Optional<SupabaseAdminUser> user = response == null || response.users() == null
					? Optional.empty()
					: response.users().stream()
							.filter(candidate -> candidate.email() != null
									&& candidate.email().equalsIgnoreCase(email))
							.findFirst();
			log.info("integration=supabase-auth operation=find-user event=success email={} found={} durationMs={}",
					maskedEmail, user.isPresent(), elapsedMillis(startedAt));
			return user;
		} catch (RestClientResponseException exception) {
			String message = formatSupabaseError(exception);
			log.warn("integration=supabase-auth operation=find-user event=http-failure email={} status={} durationMs={} reason={}",
					maskedEmail, exception.getStatusCode().value(), elapsedMillis(startedAt), message);
			throw new InvalidRequestException(message);
		} catch (RestClientException exception) {
			log.error("integration=supabase-auth operation=find-user event=transport-failure email={} durationMs={} errorType={}",
					maskedEmail, elapsedMillis(startedAt), exception.getClass().getSimpleName(), exception);
			throw new InvalidRequestException("Supabase Auth is currently unavailable");
		}
	}

	public void deleteUserQuietly(String userId) {
		if (!configured || userId == null || userId.isBlank()) return;
		long startedAt = System.nanoTime();
		log.info("integration=supabase-auth operation=delete-user event=start supabaseUserId={}", userId);
		try {
			restClient.delete().uri("/auth/v1/admin/users/{userId}", userId).retrieve().toBodilessEntity();
			log.info("integration=supabase-auth operation=delete-user event=success supabaseUserId={} durationMs={}",
					userId, elapsedMillis(startedAt));
		} catch (RuntimeException exception) {
			log.error("integration=supabase-auth operation=delete-user event=failure supabaseUserId={} durationMs={} errorType={}",
					userId, elapsedMillis(startedAt), exception.getClass().getSimpleName(), exception);
		}
	}

	private void requireConfigured() {
		if (!configured) {
			log.error("integration=supabase-auth event=configuration-required status=missing");
			throw new InvalidRequestException(
					"Supabase admin access is not configured on the SetForge backend");
		}
	}

	private String keyType(String adminKey) {
		if (adminKey == null || adminKey.isBlank()) return "none";
		return adminKey.startsWith("sb_secret_") ? "secret" : "service-role";
	}

	private String maskEmail(String email) {
		if (email == null || email.isBlank()) return "unknown";
		int separator = email.indexOf('@');
		if (separator <= 0) return "***";
		return email.charAt(0) + "***" + email.substring(separator);
	}

	private long elapsedMillis(long startedAt) {
		return (System.nanoTime() - startedAt) / 1_000_000;
	}

	private String formatSupabaseError(RestClientResponseException exception) {
		String detail = null;
		try {
			JsonNode response = objectMapper.readTree(exception.getResponseBodyAsString());
			for (String field : new String[] { "msg", "message", "error_description", "error" }) {
				String candidate = response.path(field).asText(null);
				if (candidate != null && !candidate.isBlank()) {
					detail = candidate;
					break;
				}
			}
		} catch (IOException ignored) {
			// Use the status-only message if Supabase does not return JSON.
		}
		String message = "Supabase rejected the coach login (HTTP " + exception.getStatusCode().value() + ")";
		return detail == null ? message : message + ": " + detail;
	}

	private String stripTrailingSlash(String value) {
		return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
	}

	private record CreateUserPayload(
			String email,
			String password,
			@JsonProperty("email_confirm") boolean emailConfirm,
			@JsonProperty("user_metadata") Map<String, Object> userMetadata) {
	}

	private record SupabaseUserList(List<SupabaseAdminUser> users) {
	}

	public record SupabaseAdminUser(
			String id,
			String email,
			@JsonProperty("user_metadata") Map<String, Object> userMetadata) {

		public SupabaseAdminUser(String id, String email) {
			this(id, email, Map.of());
		}
	}
}
