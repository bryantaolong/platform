package com.bryan.platform.domain.entity.llm;

import lombok.Data;

/**
 * DeepSeek 消息实体
 *
 * @author Bryan Long
 */
@Data
public class LlmChatMessage {

    private String role;

    private String content;

    public LlmChatMessage(String role, String content) {
        this.role = role;
        this.content = content;
    }
}
