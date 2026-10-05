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

	@Column(name = "body_part", length = 50)
	private String bodyPart;

	@Column(name = "muscle_group", length = 100)
	private String muscleGroup;

	@Column(name = "secondary_muscles", columnDefinition = "TEXT")
	private String secondaryMuscles;

	@Column(name = "source_name", length = 100)
	private String sourceName;

	@Column(name = "source_id", length = 50)
	private String sourceId;

	@Column(name = "thumbnail_url", length = 255)
	private String thumbnailUrl;

	@Column(name = "animation_url", length = 255)
	private String animationUrl;

	@Column(length = 255)
	private String attribution;

	@Column(name = "catalog_visible", nullable = false)
	@Builder.Default
	private boolean catalogVisible = true;
}
