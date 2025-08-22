package ai.jamerly.tiein;

import ai.jamerly.tiein.interceptor.SystemInitializationInterceptor; // Import the interceptor
import org.springframework.beans.factory.annotation.Autowired; // Import Autowired
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry; // Import InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer; // Import WebMvcConfigurer

@SpringBootApplication
public class TieInApplication implements WebMvcConfigurer { // Implement WebMvcConfigurer

  @Autowired
  private SystemInitializationInterceptor systemInitializationInterceptor; // Autowire the interceptor

  public static void main(String[] args) {
    SpringApplication.run(TieInApplication.class, args);
  }

  @Bean
  public BCryptPasswordEncoder bCryptPasswordEncoder() {
    return new BCryptPasswordEncoder();
  }

//  @Override
//  public void addInterceptors(InterceptorRegistry registry) {
//    registry.addInterceptor(systemInitializationInterceptor)
//            .addPathPatterns("/**") // Apply to all paths
//            .excludePathPatterns("" +
//                            "/user/register",
//                    "/user/login",
//                    "/chatbases/init",
//                    "/chatbases/message",
//                    "/mcp-server/status/initialized"
//            ); // Exclude the registration, login, and status endpoints
//  }
}
