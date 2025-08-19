package ai.jamerly.tiein.service;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class AIRequest {
    private String prompt;
    private String model;
    private Boolean stream = Boolean.FALSE;

    private Integer maxToken = 2000;
    private Double temperature = 1.0;
    private List<Map<String, Object>> historicalMessages;

    private String apiKey;

}
