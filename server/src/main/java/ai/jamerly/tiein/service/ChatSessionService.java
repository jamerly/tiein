package ai.jamerly.tiein.service;

import ai.jamerly.tiein.entity.ChatSession;
import ai.jamerly.tiein.repository.ChatSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChatSessionService {

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    public ChatSession getOrCreateSession(UUID id,Long chatBaseId,String userId){
        Optional<ChatSession> chatSessionOptional = chatSessionRepository.findByIdAndUserId(id,userId);
        if( chatSessionOptional.isEmpty() ){
            ChatSession chatSession = new ChatSession();
            chatSession.setId(id);
            chatSession.setUserId(userId);
            chatSession.setChatBaseId(chatBaseId);
            chatSessionRepository.save(chatSession);
            return chatSession;
        }else{
            return chatSessionOptional.get();
        }
    }

    public Optional<ChatSession> getChatSessionById(UUID sessionId) {
        return chatSessionRepository.findById(sessionId);
    }

    public Page<ChatSession> querySessions(Pageable pageable, Long chatBaseId){
        if( null == chatBaseId ){
            return chatSessionRepository.findAll(pageable);
        }else{
            return chatSessionRepository.findByChatBaseId(chatBaseId,pageable);
        }
    }

}