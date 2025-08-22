package ai.jamerly.tiein.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class RedisService {

    private final StringRedisTemplate stringRedisTemplate;

    @Autowired
    public RedisService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    /**
     * Writes a key-value pair to Redis with an optional expiration time.
     *
     * @param key The key to store.
     * @param value The value to store.
     * @param timeout The expiration time.
     * @param unit The time unit for the expiration.
     */
    public void set(String key, String value, Long timeout, TimeUnit unit) {
        if (timeout != null && unit != null) {
            stringRedisTemplate.opsForValue().set(key, value, timeout, unit);
        } else {
            stringRedisTemplate.opsForValue().set(key, value);
        }
    }

    /**
     * Reads a value from Redis given a key.
     *
     * @param key The key to retrieve the value for.
     * @return The value associated with the key, or null if the key does not exist.
     */
    public String get(String key) {
        return stringRedisTemplate.opsForValue().get(key);
    }

    /**
     * Deletes a key from Redis.
     *
     * @param key The key to delete.
     * @return True if the key was deleted, false otherwise.
     */
    public Boolean delete(String key) {
        return stringRedisTemplate.delete(key);
    }
}