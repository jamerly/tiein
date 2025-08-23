package ai.jamerly.tiein.dto;

import lombok.Data;

@Data
public class ChatMessageRequest {
    private Long sessionId;
    private String message;
}
