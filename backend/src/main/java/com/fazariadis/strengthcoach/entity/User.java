package com.fazariadis.strengthcoach.entity;

import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.entity.enums.LiftingExperience;
import com.fazariadis.strengthcoach.entity.enums.PrimaryObjective;
import com.fazariadis.strengthcoach.entity.enums.ThemePreference;
import com.fazariadis.strengthcoach.entity.enums.UnitSystem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@EqualsAndHashCode.Include
	private Long id;

	@Column(name = "auth_subject", unique = true, length = 100)
	private String authSubject;

	@Column(nullable = false, unique = true, length = 255)
	private String email;

	@Column(name = "display_name", nullable = false, length = 100)
	private String displayName;

	@Enumerated(EnumType.STRING)
	@Column(name = "account_type", nullable = false, length = 30)
	private AccountType accountType;

	@Builder.Default
	@Column(name = "onboarding_completed", nullable = false)
	private boolean onboardingCompleted = false;

	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(name = "unit_system", nullable = false, length = 20)
	private UnitSystem unitSystem = UnitSystem.METRIC;

	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(name = "primary_objective", nullable = false, length = 30)
	private PrimaryObjective primaryObjective = PrimaryObjective.STRENGTH;

	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(name = "lifting_experience", nullable = false, length = 20)
	private LiftingExperience liftingExperience = LiftingExperience.INTERMEDIATE;

	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(name = "theme_preference", nullable = false, length = 10)
	private ThemePreference themePreference = ThemePreference.DARK;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;
}
