package com.fazariadis.strengthcoach.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.ECDSASigner;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.gen.ECKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

class SecurityConfigurationTests {
	@Test
	void decodesSupabaseEs256AccessTokens() throws Exception {
		ECKey signingKey = new ECKeyGenerator(Curve.P_256).keyID("test-key").generate();
		String jwkSet = new JWKSet(signingKey.toPublicJWK()).toString();
		HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/auth/v1/.well-known/jwks.json", exchange -> {
			byte[] body = jwkSet.getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().set("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, body.length);
			exchange.getResponseBody().write(body);
			exchange.close();
		});
		server.start();

		try {
			String projectUrl = "http://127.0.0.1:" + server.getAddress().getPort();
			String issuer = projectUrl + "/auth/v1";
			JwtDecoder decoder = new SecurityConfiguration().jwtDecoder(
					projectUrl,
					projectUrl,
					"authenticated");
			Instant now = Instant.now();
			SignedJWT accessToken = new SignedJWT(
					new JWSHeader.Builder(JWSAlgorithm.ES256).keyID(signingKey.getKeyID()).build(),
					new JWTClaimsSet.Builder()
							.issuer(issuer)
							.subject("user-id")
							.audience("authenticated")
							.issueTime(Date.from(now))
							.expirationTime(Date.from(now.plusSeconds(300)))
							.build());
			accessToken.sign(new ECDSASigner(signingKey));

			Jwt decoded = decoder.decode(accessToken.serialize());

			assertThat(decoded.getSubject()).isEqualTo("user-id");
			assertThat(decoded.getAudience()).contains("authenticated");
		} finally {
			server.stop(0);
		}
	}
}
