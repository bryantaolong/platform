package com.bryan.platform.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 大模型对话配置属性类
 * 用于从配置文件中读取 LLM 相关配置，避免硬编码。
 *
 * @author Bryan Long
 */
@Component
@ConfigurationProperties(prefix = "llm.api")
@Getter
@Setter
public class LlmChatProperties {

    /**
     * 大模型平台 API Key
     */
    private String key;

    /**
     * 大模型平台请求地址
     */
    private String url;

    /**
     * 指定使用的模型名称
     */
    private String model;
}
