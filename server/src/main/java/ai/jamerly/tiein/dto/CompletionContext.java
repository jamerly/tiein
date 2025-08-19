package ai.jamerly.tiein.dto;

import lombok.Data;

import java.util.Map;

@Data
public class CompletionContext {
    private Map<String, String> arguments;
}
