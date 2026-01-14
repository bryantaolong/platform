package com.bryan.platform.domain.request.llm;

import com.bryan.platform.domain.entity.llm.LlmChatMessage;
import lombok.Data;

import java.util.List;

/**
 * DeepSeek API 请求对象
 *
 * @author Bryan Long
 */
@Data
public class LlmChatRequest {

    private String model;

    private List<LlmChatMessage> messages;
}
