package ai.jamerly.tiein.config;

import ai.jamerly.tiein.interceptor.SystemInitializationInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private SystemInitializationInterceptor systemInitializationInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(systemInitializationInterceptor)
                .addPathPatterns("/**") // Apply to all paths
                .excludePathPatterns("/user/register", "/user/login", "/mcp-server/status/initialized"); // Exclude the registration, login, and status endpoints
    }
}
