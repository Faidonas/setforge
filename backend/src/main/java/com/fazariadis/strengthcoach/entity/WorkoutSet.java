package com.fazariadis.strengthcoach.entity;

import com.fazariadis.strengthcoach.entity.enums.SetType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "workout_sets")
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class WorkoutSet {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@EqualsAndHashCode.Include
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "session_exercise_id", nullable = false)
	@ToString.Exclude
	private WorkoutSessionExercise sessionExercise;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "source_template_set_id")
	@ToString.Exclude
	private WorkoutTemplateSet sourceTemplateSet;

	@Column(nullable = false)
	private Integer position;

	@Enumerated(EnumType.STRING)
	@Column(name = "set_type", nullable = false, length = 20)
	@Builder.Default
	private SetType setType = SetType.NORMAL;

	@Column(name = "target_reps")
	private Integer targetReps;

	@Column(name = "target_weight", precision = 8, scale = 2)
	private BigDecimal targetWeight;

	@Column(name = "target_time_seconds")
	private Integer targetTimeSeconds;

	@Column(name = "rest_seconds")
	private Integer restSeconds;

	private Integer reps;

	@Column(precision = 8, scale = 2)
	private BigDecimal weight;

	@Column(name = "time_seconds")
	private Integer timeSeconds;

	@Column(name = "distance_meters", precision = 10, scale = 2)
	private BigDecimal distanceMeters;

	@Builder.Default
	@Column(nullable = false)
	private boolean completed = false;

	@Column(name = "completed_at")
	private Instant completedAt;
}
