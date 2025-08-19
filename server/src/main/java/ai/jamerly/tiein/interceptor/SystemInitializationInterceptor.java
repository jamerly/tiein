package ai.jamerly.tiein.interceptor;

import ai.jamerly.tiein.entity.User;
import ai.jamerly.tiein.repository.UserRepository;
import ai.jamerly.tiein.util.JwtUtil;
import com.alibaba.fastjson2.JSONObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

@Component
public class SystemInitializationInterceptor implements HandlerInterceptor {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // System initialization check
        if (userRepository.count() == 0) {
            response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
            response.setContentType("application/json;charset=UTF-8");
            JSONObject errorResponse = new JSONObject();
            errorResponse.put("code", HttpStatus.SERVICE_UNAVAILABLE.value());
            errorResponse.put("message", "System needs initialization: No users found. Please register the first user.");
            response.getWriter().write(errorResponse.toJSONString());
            return false;
        }

        // Admin role check for specific paths (e.g., /admin/**)
        // This interceptor is applied to all paths except /user/register and /user/login
        // So, for other paths, we check for admin role.

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(token);
            } catch (Exception e) {
                // Token is invalid or expired
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                response.setContentType("application/json;charset=UTF-8");
                JSONObject errorResponse = new JSONObject();
                errorResponse.put("code", HttpStatus.UNAUTHORIZED.value());
                errorResponse.put("message", "Invalid or expired token.");
                response.getWriter().write(errorResponse.toJSONString());
                return false;
            }
        }

        if (username != null && jwtUtil.validateToken(token, username)) {
            Optional<User> userOptional = userRepository.findByUsername(username);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                if ("ADMIN".equals(user.getRole())) {
                    return true; // Admin user, proceed
                } else {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType("application/json;charset=UTF-8");
                    JSONObject errorResponse = new JSONObject();
                    errorResponse.put("code", HttpStatus.FORBIDDEN.value());
                    errorResponse.put("message", "Access denied: Admin role required.");
                    response.getWriter().write(errorResponse.toJSONString());
                    return false;
                }
            }
        }

        // If no token or invalid token, or user not found
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json;charset=UTF-8");
        JSONObject errorResponse = new JSONObject();
        errorResponse.put("code", HttpStatus.UNAUTHORIZED.value());
        errorResponse.put("message", "Authentication required.");
        response.getWriter().write(errorResponse.toJSONString());
        return false;
    }
}
