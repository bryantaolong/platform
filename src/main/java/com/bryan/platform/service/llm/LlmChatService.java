package com.bryan.platform.service.llm;

import com.bryan.platform.config.properties.LlmChatProperties;
import com.bryan.platform.config.properties.LlmChatProperties.ProviderConfig;
import com.bryan.platform.domain.entity.llm.LlmChatMessage;
import com.bryan.platform.domain.request.llm.LlmChatRequest;
import com.bryan.platform.domain.response.LlmChatResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * DeepSeekService 业务服务类
 * 负责调用 DeepSeek API 实现聊天回复功能
 *
 * @author Bryan Long
 */
@Service
@RequiredArgsConstructor
public class LlmChatService {

    private final LlmChatProperties properties;
    private final RestTemplate restTemplate;

    // 用于保存每个用户的上下文对话（注意：生产环境应使用缓存或数据库）
    private final Map<Long, List<LlmChatMessage>> userContextMap = new HashMap<>();

    private static final int MAX_CONTEXT_SIZE = 20;

    /**
     * 与 AI 进行对话，包含上下文记忆
     *
     * @param userId 用户 ID，用于区分不同用户会话
     * @param userMessage 用户发送的消息文本
     * @return AI 返回的回复内容
     * @throws RestClientException 调用远程 API 异常
     */
    public String getChatResponse(Long userId, String userMessage) throws RestClientException {
        return getChatResponse(userId, userMessage, null);
    }

    /**
     * 与 AI 进行对话，包含上下文记忆，并支持按提供商切换模型
     *
     * @param userId 用户 ID，用于区分不同用户会话
     * @param userMessage 用户发送的消息文本
     * @param provider 大模型提供商标识（如 deepseek、moonshot、minimax），为空时使用默认配置
     * @return AI 返回的回复内容
     * @throws RestClientException 调用远程 API 异常
     */
    public String getChatResponse(Long userId, String userMessage, String provider) throws RestClientException {
        // 1. 获取用户历史消息上下文
        List<LlmChatMessage> context = userContextMap.computeIfAbsent(userId, k -> new ArrayList<>());

        // 2. 添加当前用户消息
        context.add(new LlmChatMessage("user", userMessage));

        // 3. 解析大模型配置（支持多提供商）
        ProviderConfig config = properties.getProviderConfig(provider);

        // 4. 构建请求体
        LlmChatRequest request = new LlmChatRequest();
        request.setModel(config.getModel());
        request.setMessages(trimContext(context)); // 控制上下文数量

        // 5. 设置请求头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + config.getKey());

        HttpEntity<LlmChatRequest> httpEntity = new HttpEntity<>(request, headers);

        // 6. 调用远程 API
        ResponseEntity<LlmChatResponse> response = restTemplate.postForEntity(
                config.getUrl(),
                httpEntity,
                LlmChatResponse.class
        );

        // 7. 记录 AI 回复并返回
        String reply = Objects.requireNonNull(response.getBody()).getFirstReply();
        context.add(new LlmChatMessage("assistant", reply));
        return reply;
    }

    /**
     * 生成文章摘要（不保留上下文）
     *
     * @param title 文章标题
     * @param content 文章内容
     * @return AI 生成的摘要
     * @throws RestClientException 调用远程 API 异常
     */
    public String generatePostSummary(String title, String content) throws RestClientException {
        return generatePostSummary(title, content, null);
    }

    /**
     * 生成文章摘要（不保留上下文），支持按提供商切换模型
     *
     * @param title 文章标题
     * @param content 文章内容
     * @param provider 大模型提供商标识（如 deepseek、moonshot、minimax），为空时使用默认配置
     * @return AI 生成的摘要
     * @throws RestClientException 调用远程 API 异常
     */
    public String generatePostSummary(String title, String content, String provider) throws RestClientException {
        // 1. 构建用于生成摘要的提示词
        String prompt = String.format(
                "请为以下文章生成一份简洁的摘要（200-300字），突出文章的核心观点和主要内容。\n\n" +
                "文章标题：%s\n\n" +
                "文章内容：\n%s",
                title, content
        );

        // 2. 构建单次对话的消息列表（不使用上下文）
        List<LlmChatMessage> messages = new ArrayList<>();
        messages.add(new LlmChatMessage("user", prompt));

        // 3. 解析大模型配置（支持多提供商）
        ProviderConfig config = properties.getProviderConfig(provider);

        // 4. 构建请求体
        LlmChatRequest request = new LlmChatRequest();
        request.setModel(config.getModel());
        request.setMessages(messages);

        // 5. 设置请求头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + config.getKey());

        HttpEntity<LlmChatRequest> httpEntity = new HttpEntity<>(request, headers);

        // 6. 调用远程 API
        ResponseEntity<LlmChatResponse> response = restTemplate.postForEntity(
                config.getUrl(),
                httpEntity,
                LlmChatResponse.class
        );

        // 7. 返回 AI 生成的摘要
        return Objects.requireNonNull(response.getBody()).getFirstReply();
    }

    /**
     * 清空指定用户的上下文（可提供给控制器或前端手动清空上下文）
     *
     * @param userId 用户 ID
     */
    public void clearContext(Long userId) {
        userContextMap.remove(userId);
    }

    /**
     * 保持上下文消息条数在限制范围内
     */
    private List<LlmChatMessage> trimContext(List<LlmChatMessage> context) {
        int start = Math.max(0, context.size() - MAX_CONTEXT_SIZE);
        return context.subList(start, context.size());
    }
}
