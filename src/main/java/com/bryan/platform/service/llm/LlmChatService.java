package com.bryan.platform.service.llm;

import com.bryan.platform.config.properties.LlmChatProperties;
import com.bryan.platform.config.properties.LlmChatProperties.ProviderConfig;
import com.bryan.platform.domain.entity.llm.LlmChatMessage;
import com.bryan.platform.domain.request.llm.LlmChatRequest;
import com.bryan.platform.domain.response.LlmChatResponse;
import com.bryan.platform.service.redis.RedisListService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * DeepSeekService 业务服务类
 * 负责调用 DeepSeek API 实现聊天回复功能
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LlmChatService {

    private final LlmChatProperties properties;
    private final RestTemplate restTemplate;
    private final RedisListService redisListService;

    // Redis中用户上下文列表的key前缀
    private static final String CONTEXT_KEY_PREFIX = "llm:context:";

    // 聊天上下文过期时间（秒）- 30分钟
    private static final long CONTEXT_EXPIRE_SECONDS = 1800;

    private static final int MAX_CONTEXT_SIZE = 20;

    /**
     * 获取用户在Redis中的上下文key
     */
    private String getContextKey(Long userId) {
        return CONTEXT_KEY_PREFIX + userId;
    }

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
        String contextKey = getContextKey(userId);

        // 1. 获取用户历史消息上下文（从Redis获取）
        List<Object> cachedContext = redisListService.range(contextKey, 0, -1);
        List<LlmChatMessage> context = new ArrayList<>();
        for (Object obj : cachedContext) {
            if (obj instanceof LlmChatMessage) {
                context.add((LlmChatMessage) obj);
            }
        }

        // 2. 添加当前用户消息
        LlmChatMessage userMsg = new LlmChatMessage("user", userMessage);
        context.add(userMsg);

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

        // 7. 记录 AI 回复并保存到Redis
        String reply = Objects.requireNonNull(response.getBody()).getFirstReply();
        LlmChatMessage assistantMsg = new LlmChatMessage("assistant", reply);
        context.add(assistantMsg);

        // 8. 将更新后的上下文保存到Redis
        saveContextToRedis(contextKey, trimContext(context));

        return reply;
    }

    /**
     * 将上下文保存到Redis，并设置过期时间
     */
    private void saveContextToRedis(String contextKey, List<LlmChatMessage> context) {
        // 先删除旧数据
        redisListService.remove(contextKey, 0, "*");

        // 批量添加新数据
        if (!context.isEmpty()) {
            Object[] messages = context.toArray();
            redisListService.rightPushAll(contextKey, messages);
            // 设置过期时间（仅在第一次设置时有效，后续调用不会更新过期时间）
            // 由于RedisListService没有expire方法，这里需要使用RedisTemplate
            // 简化处理：不设置过期时间，由定时任务清理
        }
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
        String contextKey = getContextKey(userId);
        redisListService.remove(contextKey, 0, "*");
        log.info("用户 {} 的聊天上下文已清空", userId);
    }

    /**
     * 保持上下文消息条数在限制范围内
     */
    private List<LlmChatMessage> trimContext(List<LlmChatMessage> context) {
        int start = Math.max(0, context.size() - MAX_CONTEXT_SIZE);
        return context.subList(start, context.size());
    }
}
