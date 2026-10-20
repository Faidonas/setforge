package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.User;
import com.fazariadis.strengthcoach.entity.enums.AccountType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmailIgnoreCase(String email);

	Optional<User> findByAuthSubject(String authSubject);

	List<User> findAllByAccountTypeInOrderByDisplayNameAsc(
			Collection<AccountType> accountTypes);

	boolean existsByEmailIgnoreCase(String email);
}
