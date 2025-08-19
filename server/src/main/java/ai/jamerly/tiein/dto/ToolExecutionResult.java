package ai.jamerly.tiein.dto;

import lombok.Data;

@Data
public class ToolExecutionResult {
    private String output;
    private boolean success;
    private String errorMessage;
}
