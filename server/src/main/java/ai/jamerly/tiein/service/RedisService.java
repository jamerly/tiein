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

    /**
     * Acquires a distributed lock using Redis.
     *
     * @param key The lock key.
     * @param value The lock value (e.g., a unique request ID).
     * @param timeout The lock expiration time.
     * @param unit The time unit for the lock expiration.
     * @return True if the lock was acquired, false otherwise.
     */
    public Boolean acquireLock(String key, String value, long timeout, TimeUnit unit) {
        return stringRedisTemplate.opsForValue().setIfAbsent(key, value, timeout, unit);
    }

    /**
     * Releases a distributed lock using Redis.
     *
     * @param key The lock key.
     * @param value The lock value (must match the value used to acquire the lock).
     * @return True if the lock was released, false otherwise.
     */
    public Boolean releaseLock(String key, String value) {
        // Use a Lua script for atomic release to prevent releasing a lock set by another client
        // or a lock that has expired and been re-acquired by another client.
        String script = "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end";
        Long result = stringRedisTemplate.execute((org.springframework.data.redis.core.script.RedisScript<Long>) org.springframework.data.redis.core.script.RedisScript.of(script, String.class), java.util.Collections.singletonList(key), value);
        return result != null && result > 0;
    }
}