package com.bryan.platform.domain.response;

import com.bryan.platform.domain.entity.llm.LlmChatMessage;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * DeepSeek API 响应对象
 *
 * @author Bryan Long
 */
@Data
public class LlmChatResponse {
    /**
     * 实际使用的模型名称，由第三方大模型服务返回
     * 例如：deepseek-chat、kimi-k2-turbo-preview、MiniMax-M2.1 等
     */
    private String model;

    private List<Choice> choices;

    public String getFirstReply() {
        return choices.get(0).getMessage().getContent();
    }
}

@Getter
@Setter
class Choice {
    private LlmChatMessage message;
}
