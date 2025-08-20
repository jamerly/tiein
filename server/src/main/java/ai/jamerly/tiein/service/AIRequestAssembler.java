package ai.jamerly.tiein.service;

import org.springframework.http.HttpEntity;
import reactor.core.publisher.Flux;

public interface AIRequestAssembler {
    HttpEntity<?> assembleRequest(AIRequest aiRequest);

    String getApiUrl();
    Flux<String> invoke(AIRequest request);

}
