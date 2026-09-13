package com.fazariadis.strengthcoach.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "exercises")
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

	@Column(columnDefinition = "TEXT")
	private String instructions;

	protected Exercise() {
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getPrimaryMuscle() {
		return primaryMuscle;
	}

	public String getEquipment() {
		return equipment;
	}

	public String getInstructions() {
		return instructions;
	}
}
