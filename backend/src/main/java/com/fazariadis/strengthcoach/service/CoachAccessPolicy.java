package com.fazariadis.strengthcoach.service;

import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import com.fazariadis.strengthcoach.exception.ForbiddenOperationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CoachAccessPolicy {

	public boolean hasAccess(AccountType accountType) {
		return accountType == AccountType.ADMIN || accountType == AccountType.PERSONAL_TRAINER;
	}

	public void requireAccess(User user) {
		if (user == null || !hasAccess(user.getAccountType())) {
			log.warn("area=coach-dashboard event=access-denied requirement=coach userId={} accountType={}",
					user == null ? null : user.getId(), user == null ? null : user.getAccountType());
			throw new ForbiddenOperationException("Coach dashboard access is not enabled for this account");
		}
	}

	public void requireAdmin(User user) {
		if (user == null || user.getAccountType() != AccountType.ADMIN) {
			log.warn("area=coach-dashboard event=access-denied requirement=admin userId={} accountType={}",
					user == null ? null : user.getId(), user == null ? null : user.getAccountType());
			throw new ForbiddenOperationException("Administrator access is required");
		}
	}
}
