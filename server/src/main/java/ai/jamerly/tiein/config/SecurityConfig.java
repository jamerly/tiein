package ai.jamerly.tiein.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // Disable CSRF for API-only backend
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(
                        "/user/register",
                        "/mcp-server/status/initialized",
                        "/user/login").permitAll() // Allow registration and login without authentication
                .anyRequest().permitAll() // Temporarily permit all requests
            );
        return http.build();
    }
}
