package ai.jamerly.tiein.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final MCPWebSocketHandler mcpWebSocketHandler;

    public WebSocketConfig(MCPWebSocketHandler mcpWebSocketHandler) {
        this.mcpWebSocketHandler = mcpWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(mcpWebSocketHandler, "/mcp-ws").setAllowedOrigins("*");
    }
}
