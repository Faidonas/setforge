package com.fazariadis.strengthcoach.repository;

import com.fazariadis.strengthcoach.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmailIgnoreCase(String email);

	Optional<User> findByAuthSubject(String authSubject);

	boolean existsByEmailIgnoreCase(String email);
}
