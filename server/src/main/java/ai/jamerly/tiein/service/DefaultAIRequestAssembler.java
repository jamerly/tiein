package ai.jamerly.tiein.service;

import ai.jamerly.tiein.util.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

public class DefaultAIRequestAssembler implements AIRequestAssembler {

    @Autowired
    protected WebClient webClient;

    @Override
    public HttpEntity<?> assembleRequest(AIRequest aiRequest) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Default headers or modifications
        return new HttpEntity<>(aiRequest, headers);
    }

    @Override
    public Flux<String> invoke(AIRequest request) {
        HttpEntity<?> httpEntity = this.assembleRequest(request);
        return webClient.post()
                .uri(getApiUrl())
                .headers(headers -> headers.addAll(httpEntity.getHeaders()))
                .bodyValue(httpEntity.getBody())
                .retrieve()
                .bodyToFlux(String.class);
    }

    /**
     * This method should be implemented by subclasses to provide the specific API endpoint URL.
     * @return The API URL
     */
    @Override
    public String getApiUrl() {
        throw new BizException("Method is not implemented", 502);
    }
}
