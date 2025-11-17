package com.hexagram.quill.controller;

import com.hexagram.quill.dto.koios.KoiosAddressInfoRequest;
import com.hexagram.quill.dto.koios.KoiosTxInfoRequest;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/koios")
public class KoiosProxyController {

    private final RestTemplate restTemplate;

    public KoiosProxyController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    private String resolveBaseUrl(String network) {
        if (network == null) {
            return "https://preview.koios.rest/api/v1";
        }
        return switch (network.toLowerCase()) {
            case "preprod" -> "https://preprod.koios.rest/api/v1";
            case "mainnet" -> "https://api.koios.rest/api/v1";
            default -> "https://preview.koios.rest/api/v1";
        };
    }

    private HttpHeaders defaultHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    @PostMapping("/address-info")
    public ResponseEntity<?> proxyAddressInfo(@RequestBody KoiosAddressInfoRequest request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("_addresses", request.getAddresses());

        return forwardToKoios(resolveBaseUrl(request.getNetwork()) + "/address_info", payload);
    }

    @PostMapping("/tx-info")
    public ResponseEntity<?> proxyTxInfo(@RequestBody KoiosTxInfoRequest request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("_tx_hashes", request.getTxHashes());

        return forwardToKoios(resolveBaseUrl(request.getNetwork()) + "/tx_info", payload);
    }

    private ResponseEntity<?> forwardToKoios(String url, Object payload) {
        try {
            HttpEntity<Object> entity = new HttpEntity<>(payload, defaultHeaders());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (HttpStatusCodeException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(ex.getMessage());
        }
    }
}

