package ai.jamerly.tiein.service;

import ai.jamerly.tiein.util.BizException;
import com.alibaba.fastjson2.JSONObject;
import lombok.Data;
import org.jsoup.internal.StringUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class OuterUserService {
    @Autowired
    RedisService redisService;

    @Autowired
    WebClient.Builder webClientBuilder;

    @Autowired
    OpenAIRequestAssembler openAIRequestAssembler;
    public String getProfileFromAuth(String authUrl, String auth){
        assert !StringUtil.isBlank(auth);
        String profileCache = redisService.get("user_profile_auth:" + auth);
        if( !StringUtil.isBlank(profileCache)){
            return profileCache;
        }
        String userProfile = webClientBuilder.build().get()
                .uri(authUrl)
                .header("Authorization", auth)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        if( !StringUtil.isBlank(userProfile)){
            redisService.set("user_profile_auth:" + auth,userProfile,
                    1L,TimeUnit.DAYS);
        }
        return userProfile;
    }

    private String _parseUserId(String userProfile){
        String[] userIdPatterns = {
                "\"userId\"\\s*:\\s*\"([^\"]+)\"",           // "userId":"uuid-string"
                "\"userId\"\\s*:\\s*(\\d+)",                 // "userId":123
                "'userId'\\s*:\\s*'([^']+)'",                // 'userId':'uuid-string'
                "'userId'\\s*:\\s*(\\d+)",                   // 'userId':123
                "userId\\s*=\\s*\"([^\"]+)\"",               // userId="uuid-string"
                "userId\\s*=\\s*(\\d+)",                     // userId=123
                "userId\\s*:\\s*([a-fA-F0-9-]+)(?![a-fA-F0-9-])" // userId:uuid-without-quotes
        };
        for (String patternStr : userIdPatterns) {
            Pattern pattern = Pattern.compile(patternStr);
            Matcher matcher = pattern.matcher(userProfile);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        String[] idPatterns = {
                "\"id\"\\s*:\\s*\"([^\"]+)\"",           // "userId":"uuid-string"
                "\"id\"\\s*:\\s*(\\d+)",                 // "userId":123
                "'id'\\s*:\\s*'([^']+)'",                // 'userId':'uuid-string'
                "'id'\\s*:\\s*(\\d+)",                   // 'userId':123
                "id\\s*=\\s*\"([^\"]+)\"",               // userId="uuid-string"
                "id\\s*=\\s*(\\d+)",                     // userId=123
                "id\\s*:\\s*([a-fA-F0-9-]+)(?![a-fA-F0-9-])" // userId:uuid-without-quotes
        };
        for (String patternStr : idPatterns) {
            Pattern pattern = Pattern.compile(patternStr);
            Matcher matcher = pattern.matcher(userProfile);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        String prompt = String.format("Given the user profile %s, " +
                "return the userId or username from profile using JSON format: " +
                "```{ \"userId\": \"userId or username from userprofile, if userprofile not exist will use -1 \" }```", userProfile);
        AIRequest aiRequest = new AIRequest();
        aiRequest.setPrompt(prompt);
        aiRequest.setModel("gpt-3.5-turbo"); // Or another appropriate model
        aiRequest.setStream(Boolean.FALSE); // Not streaming for a single welcome message
        // Invoke OpenAIRequestAssembler and block to get the result
        // This is a simplified approach. For production, consider async handling or a dedicated AI service.
        Flux<String> aiResponseFlux = openAIRequestAssembler.invoke(aiRequest);
        List<String> greetingJSON = aiResponseFlux.collectList().block().stream().map(t->{
            if(!StringUtil.isBlank(t)){
                if( "[DONE]".equals(t.trim()) ){
                    return "";
                }else{
                    JSONObject jsonObject = JSONObject.parseObject(t.trim());
                    return jsonObject.getString("chunk");
                }
            }
            return "";
        }).collect(Collectors.toList());
        String JSONString =  greetingJSON.stream().collect(Collectors.joining());
        JSONObject userIdJson = JSONObject.parseObject(JSONString);
        return userIdJson.getString("userId");
    }
    public String parseUserIdFromAuth(String authUrl, String auth){
        String userProfile = getProfileFromAuth(authUrl,auth);
        if( StringUtil.isBlank(userProfile)){
            throw new BizException("User profile load failed",500);
        }
        String idCache = redisService.get("user_id_auth:" + auth);
        if( !StringUtil.isBlank(idCache)){
            return idCache;
        }
        String userId = _parseUserId(userProfile);
        if( StringUtil.isBlank(userId)){
            throw new BizException("User id load failed",500);
        }
        redisService.set("user_id_auth:" + auth,userId,
                1L,TimeUnit.DAYS);
        return userId;
    }
}
