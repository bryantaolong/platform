package com.bryan.platform.domain.entity.llm;

import lombok.Data;

/**
 * 大模型对话消息实体
 * 用于封装单次对话的角色与内容，支持多轮上下文传递。
 *
 * @author Bryan Long
 */
@Data
public class LlmChatMessage {

    /**
     * 消息角色
     * 典型值：system | user | assistant
     */
    private String role;

    /**
     * 消息内容
     */
    private String content;

    /**
     * 全参构造
     *
     * @param role    消息角色
     * @param content 消息内容
     */
    public LlmChatMessage(String role, String content) {
        this.role = role;
        this.content = content;
    }
}
