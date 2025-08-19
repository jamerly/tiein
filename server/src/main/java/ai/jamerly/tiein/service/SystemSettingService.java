package ai.jamerly.tiein.service;

import ai.jamerly.tiein.entity.SystemSetting;
import ai.jamerly.tiein.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SystemSettingService {

    private static final String REGISTRATION_OPEN_KEY = "registration.open";
    private static final String OPENAI_API_KEY = "openai.api.key"; // New constant for OpenAI API Key

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    public boolean isRegistrationOpen() {
        Optional<SystemSetting> setting = systemSettingRepository.findBySettingKey(REGISTRATION_OPEN_KEY);
        return setting.map(systemSetting -> Boolean.parseBoolean(systemSetting.getSettingValue())).orElse(true); // Default to true if not set
    }

    public void setRegistrationOpen(boolean open) {
        Optional<SystemSetting> settingOptional = systemSettingRepository.findBySettingKey(REGISTRATION_OPEN_KEY);
        SystemSetting setting;
        if (settingOptional.isPresent()) {
            setting = settingOptional.get();
        } else {
            setting = new SystemSetting();
            setting.setSettingKey(REGISTRATION_OPEN_KEY);
        }
        setting.setSettingValue(String.valueOf(open));
        systemSettingRepository.save(setting);
    }

    public String getOpenAIApiKey() {
        Optional<SystemSetting> setting = systemSettingRepository.findBySettingKey(OPENAI_API_KEY);
        return setting.map(SystemSetting::getSettingValue).orElse(null); // Return null if not set
    }

    public void setOpenAIApiKey(String apiKey) {
        Optional<SystemSetting> settingOptional = systemSettingRepository.findBySettingKey(OPENAI_API_KEY);

        if (apiKey == null) {
            // If API key is null or empty, delete the setting if it exists
            settingOptional.ifPresent(systemSetting -> systemSettingRepository.delete(systemSetting));
        } else {
            // Otherwise, save or update the setting
            SystemSetting setting;
            if (settingOptional.isPresent()) {
                setting = settingOptional.get();
            } else {
                setting = new SystemSetting();
                setting.setSettingKey(OPENAI_API_KEY);
            }
            setting.setSettingValue(apiKey);
            systemSettingRepository.save(setting);
        }
    }

    public void deleteOpenAIApiKey() {
        Optional<SystemSetting> settingOptional = systemSettingRepository.findBySettingKey(OPENAI_API_KEY);
        settingOptional.ifPresent(systemSetting -> systemSettingRepository.delete(systemSetting));
    }

    public List<SystemSetting> getAllSystemSettings() {
        return systemSettingRepository.findAll();
    }
}
