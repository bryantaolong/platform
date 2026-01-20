package com.bryan.platform.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * DeepSeekApiProperties
 *
 * @author Bryan Long
 */
@Component
@ConfigurationProperties(prefix = "llm.api")
@Getter
@Setter
public class LlmChatProperties {

    private String key;

    private String url;

    private String model;
}
