package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.SetType;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreviousExerciseSetResponse {

	private Integer position;
	private SetType setType;
	private Integer reps;
	private BigDecimal weight;
	private Integer timeSeconds;
}
