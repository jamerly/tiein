package ai.jamerly.tiein.service;

import ai.jamerly.tiein.util.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

@Component
public class WebClientAIRequestAssembler implements AIRequestAssembler {

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Override
    public HttpEntity<?> assembleRequest(AIRequest aiRequest) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Default headers or modifications
        return new HttpEntity<>(aiRequest, headers);
    }

    @Override
    public Flux<String> invoke(AIRequest request) {
        WebClient webClient = webClientBuilder.baseUrl(getApiUrl()).build();
        HttpEntity<?> httpEntity = this.assembleRequest(request);

        return webClient.post()
                .uri("") // URI is already part of baseUrl
                .headers(httpHeaders -> httpHeaders.addAll(httpEntity.getHeaders()))
                .bodyValue(httpEntity.getBody())
                .retrieve()
                .bodyToFlux(String.class);
    }

    @Override
    public String getApiUrl() {
        throw new BizException("Method is not implemented", 502);
    }
}
