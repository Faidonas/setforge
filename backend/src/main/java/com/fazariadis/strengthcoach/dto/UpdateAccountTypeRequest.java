package com.fazariadis.strengthcoach.dto;

import com.fazariadis.strengthcoach.entity.enums.AccountType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAccountTypeRequest {

	@NotNull
	private AccountType accountType;
}
