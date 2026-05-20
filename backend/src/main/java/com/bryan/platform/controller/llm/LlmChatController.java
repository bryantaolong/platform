package com.bryan.platform.controller.llm;

import com.bryan.platform.service.auth.AuthService;
import com.bryan.platform.service.llm.LlmChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

/**
 * 控制器：AI 聊天接口
 * 提供与 AI 聊天机器人进行对话的接口，接受用户输入并返回 AI 的回复。
 *
 * @author Bryan Long
 */
@Slf4j
@RestController
@RequestMapping("/api/llm/chat")
@RequiredArgsConstructor
public class LlmChatController {

    private final LlmChatService llmChatService;
    private final AuthService authService;

    /**
     * 与 AI 进行对话
     *
     * @param payload 请求体，包含用户输入的消息，格式为 {"message": "用户输入", "provider": "deepseek|moonshot|minimax"}
     * @return 返回 AI 回复的消息，格式为 {"reply": "AI 回复内容"}
     *
     * @throws IllegalArgumentException 如果消息内容为空或格式不正确
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> chat(@RequestBody Map<String, String> payload) {
        // 1. 获取用户 ID
        Long currentUserId = authService.getCurrentUserId();

        // 2. 从请求体中获取用户输入的消息和模型提供商
        String userMessage = payload.get("message");
        String provider = payload.get("provider");
        log.info("接收到用户消息: {}，模型提供商：{}", userMessage,  provider);

        // 3. 校验消息内容是否为空
        if (userMessage == null || userMessage.trim().isEmpty()) {
            log.warn("消息内容为空");
            throw new IllegalArgumentException("消息内容不能为空");
        }

        // 4. 调用 AI 服务获取回复内容（支持按提供商切换模型）
        String reply = llmChatService.getChatResponse(currentUserId, userMessage, provider);

        // 5. 封装回复结果返回
        return Collections.singletonMap("reply", reply);
    }

    /**
     * 生成文章 AI 摘要
     *
     * @param payload 请求体，包含文章标题和内容，格式为 {"title": "文章标题", "content": "文章内容", "provider": "deepseek|moonshot|minimax"}
     * @return 返回 AI 生成的摘要，格式为 {"summary": "AI 摘要内容"}
     *
     * @throws IllegalArgumentException 如果标题或内容为空
     */
    @PostMapping("/post/summary")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> generateSummary(@RequestBody Map<String, String> payload) {
        // 1. 从请求体中获取文章标题、内容和模型提供商
        String title = payload.get("title");
        String content = payload.get("content");
        String provider = payload.get("provider");
        log.info("接收到摘要生成请求，文章标题: {}，模型提供商：{}", title, provider);

        // 2. 校验标题和内容是否为空
        if (title == null || title.trim().isEmpty()) {
            log.warn("文章标题为空");
            throw new IllegalArgumentException("文章标题不能为空");
        }
        if (content == null || content.trim().isEmpty()) {
            log.warn("文章内容为空");
            throw new IllegalArgumentException("文章内容不能为空");
        }

        // 3. 调用 AI 服务生成摘要（支持按提供商切换模型）
        String summary = llmChatService.generatePostSummary(title, content, provider);

        // 4. 封装结果返回
        return Collections.singletonMap("summary", summary);
    }

    /**
     * 清空当前用户的聊天上下文
     *
     * @return 返回清空结果提示信息，格式为 {"message": "上下文已清空"}
     */
    @PostMapping("/clear")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> clearContext() {
        // 1. 获取当前登录用户 ID
        Long currentUserId = authService.getCurrentUserId();
        log.info("请求清空用户 {} 的上下文", currentUserId);

        // 2. 调用服务清空对应上下文数据
        llmChatService.clearContext(currentUserId);

        // 3. 返回成功提示信息
        return Collections.singletonMap("message", "上下文已清空");
    }
}
