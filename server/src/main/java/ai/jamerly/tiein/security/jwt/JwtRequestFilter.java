package ai.jamerly.tiein.security.jwt;

import ai.jamerly.tiein.service.UserService; // Assuming UserService can load UserDetails
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService; // Or a UserDetailsService implementation

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;
        String permanentToken = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                // Log or handle invalid JWT token
                System.err.println("Invalid JWT Token: " + e.getMessage());
            }
        } else if (authorizationHeader != null && authorizationHeader.startsWith("Permanent ")) {
            permanentToken = authorizationHeader.substring(10);
            try {
                UserDetails userDetails = userService.loadUserByPermanentToken(permanentToken);
                if (userDetails != null) {
                    username = userDetails.getUsername();
                }
            } catch (Exception e) {
                System.err.println("Invalid Permanent Token: " + e.getMessage());
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userService.loadUserByUsername(username);

            boolean authenticated = false;
            if (jwt != null && jwtUtil.validateToken(jwt, userDetails)) {
                authenticated = true;
            } else if (permanentToken != null) { // Permanent token already loaded userDetails
                authenticated = true;
            }

            if (authenticated) {
                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                usernamePasswordAuthenticationToken
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
            }
        }
        chain.doFilter(request, response);
    }
}
