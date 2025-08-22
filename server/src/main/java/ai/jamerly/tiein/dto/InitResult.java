package ai.jamerly.tiein.dto;

import lombok.Data;

@Data
public class InitResult {
    private Boolean success = Boolean.FALSE;
    private String userId;
    private String message;
}
