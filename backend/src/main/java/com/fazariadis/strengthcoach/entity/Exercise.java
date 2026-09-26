package com.fazariadis.strengthcoach.entity;

import com.fazariadis.strengthcoach.entity.enums.ExerciseType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "exercises")
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Exercise {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 100)
	private String name;

	@Column(name = "primary_muscle", nullable = false, length = 50)
	private String primaryMuscle;

	@Column(nullable = false, length = 50)
	private String equipment;

	@Enumerated(EnumType.STRING)
	@Column(name = "exercise_type", nullable = false, length = 30)
	@Builder.Default
	private ExerciseType exerciseType = ExerciseType.WEIGHT_AND_REPS;

	@Column(columnDefinition = "TEXT")
	private String instructions;
}
