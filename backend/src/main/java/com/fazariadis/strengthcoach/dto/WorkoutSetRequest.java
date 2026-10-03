package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.SetType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutSetRequest {

	private Long id;

	@NotNull
	@Builder.Default
	private SetType setType = SetType.NORMAL;

	@Min(0)
	private Integer targetReps;

	@DecimalMin("0.0")
	private BigDecimal targetWeight;

	@Min(1)
	private Integer targetTimeSeconds;

	@Min(0)
	private Integer restSeconds;

	@Min(0)
	private Integer reps;

	@DecimalMin("0.0")
	private BigDecimal weight;

	@Min(0)
	private Integer timeSeconds;

	@NotNull
	@Builder.Default
	private Boolean completed = false;
}
