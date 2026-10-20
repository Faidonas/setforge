package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.ThemePreference;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateThemePreferenceRequest {

	@NotNull
	private ThemePreference themePreference;
}
