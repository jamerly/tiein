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

    public List<SystemSetting> getAllSystemSettings() {
        return systemSettingRepository.findAll();
    }
}
