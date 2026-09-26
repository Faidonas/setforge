package com.fazariadis.strengthcoach.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fazariadis.strengthcoach.entity.enums.SetType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutTemplateSetResponse {

	private Long id;
	private Integer position;
	private SetType setType;
	private Integer targetReps;
	private BigDecimal targetWeight;
	private Integer targetTimeSeconds;
	private Integer restSeconds;
}
