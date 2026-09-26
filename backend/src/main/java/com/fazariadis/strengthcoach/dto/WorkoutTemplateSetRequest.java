package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.SetType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "A planned set. Its position is determined by its array order.")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutTemplateSetRequest {

	@Schema(description = "Set category", example = "NORMAL")
	@NotNull
	@Builder.Default
	private SetType setType = SetType.NORMAL;

	@PositiveOrZero
	@Schema(description = "Target repetitions for WEIGHT_AND_REPS exercises", example = "8", nullable = true)
	private Integer targetReps;

	@PositiveOrZero
	@Digits(integer = 6, fraction = 2)
	@Schema(description = "Target weight for WEIGHT_AND_REPS exercises", example = "60.00", nullable = true)
	private BigDecimal targetWeight;

	@Positive
	@Schema(description = "Target timer for a timed exercise, in seconds", example = "45", nullable = true)
	private Integer targetTimeSeconds;

	@PositiveOrZero
	@Schema(description = "Rest after completing the set, in seconds", example = "90", nullable = true)
	private Integer restSeconds;
}
