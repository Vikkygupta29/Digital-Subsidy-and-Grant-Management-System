package com.infosys.subsidy.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class TurnstileService {

    private static final Logger log = LoggerFactory.getLogger(TurnstileService.class);
    private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private final RestClient restClient;
    private final String secretKey;

    public TurnstileService(
            RestClient.Builder restClientBuilder,
            @Value("${app.turnstile.secret-key:}") String secretKey
    ) {
        this.restClient = restClientBuilder.build();
        this.secretKey = secretKey;
    }

    public boolean verify(String token) {
        if (secretKey.isBlank() || token == null || token.isBlank()) {
            log.error("Cloudflare Turnstile is not configured or the client sent no token");
            return false;
        }

        try {
            TurnstileResponse response = restClient.post()
                    .uri(VERIFY_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body("secret=" + encode(secretKey) + "&response=" + encode(token))
                    .retrieve()
                    .body(TurnstileResponse.class);

            return response != null && response.success();
        } catch (RestClientException exception) {
            log.error("Cloudflare Turnstile verification request failed", exception);
            return false;
        }
    }

    private String encode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }

    private record TurnstileResponse(boolean success, @JsonProperty("error-codes") String[] errorCodes) {
    }
}
