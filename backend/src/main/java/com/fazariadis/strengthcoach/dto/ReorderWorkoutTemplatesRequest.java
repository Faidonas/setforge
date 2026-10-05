package com.fazariadis.strengthcoach.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "The complete display order of one user's workout templates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderWorkoutTemplatesRequest {

	@NotNull
	private Long ownerId;

	@NotNull
	@Builder.Default
	private List<@NotNull Long> templateIds = new ArrayList<>();
}
