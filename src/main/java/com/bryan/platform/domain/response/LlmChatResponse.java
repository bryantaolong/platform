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
