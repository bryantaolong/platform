package com.bryan.platform.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Map;

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
     * 默认使用的大模型提供商名称
     * 例如：DeepSeek、Moonshot、MiniMax
     */
    private String defaultProvider;

    /**
     * 各大模型提供商的配置
     * key 为提供商名称（如 DeepSeek、Moonshot、MiniMax）
     */
    private Map<String, ProviderConfig> providers;

    /**
     * 根据提供商名称获取配置，如果未指定则使用默认提供商。
     *
     * @param provider 提供商名称
     * @return 对应的配置
     * @throws IllegalArgumentException 当提供商不存在时抛出
     */
    public ProviderConfig getProviderConfig(String provider) {
        String effectiveProvider = (provider == null || provider.isEmpty()) ? defaultProvider : provider;
        if (providers == null || !providers.containsKey(effectiveProvider)) {
            throw new IllegalArgumentException("Unsupported LLM provider: " + effectiveProvider);
        }
        return providers.get(effectiveProvider);
    }

    /**
     * 单个大模型提供商的配置
     */
    @Getter
    @Setter
    public static class ProviderConfig {

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
}
