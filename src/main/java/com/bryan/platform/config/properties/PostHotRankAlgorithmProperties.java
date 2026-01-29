package com.bryan.platform.config.properties;

import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * PostHotRankAlgorithmProperties
 *
 * @author Bryan Long
 */
@Setter
@Component
public class PostHotRankAlgorithmProperties {
    private Map<String, Double> weights = new HashMap<>();

    public double get(String key) {
        return weights.getOrDefault(key, 1.0);
    }

}
