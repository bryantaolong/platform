package com.bryan.platform.controller.user;

import com.bryan.platform.domain.dto.user.SendMessageDTO;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.domain.response.Result;
import com.bryan.platform.domain.vo.user.ConversationVO;
import com.bryan.platform.domain.vo.user.UserMessageVO;
import com.bryan.platform.service.auth.AuthService;
import com.bryan.platform.service.user.UserMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 用户私信消息控制器
 * 提供用户之间发送私信、查询消息、撤回消息、获取会话列表等 RESTful API。
 * 仅支持相互关注的用户之间发送消息。
 *
 * @author Bryan Long
 */
@RestController
@RequestMapping("/api/user-messages")
@RequiredArgsConstructor
public class UserMessageController {

    private final UserMessageService userMessageService;
    private final AuthService authService;

    /**
     * 发送私信给指定用户
     * 仅支持向互相关注的用户发送消息
     *
     * @param dto 发送消息请求，包含接收者ID和消息内容
     * @return 消息ID
     */
    @PostMapping("/send")
    @PreAuthorize("isAuthenticated()")
    public Result<Long> sendMessage(@RequestBody @Valid SendMessageDTO dto) {
        Long currentUserId = authService.getCurrentUserId();
        Long messageId = userMessageService.sendMessage(
                currentUserId, dto.getReceiverId(), dto.getContent());
        return Result.success(messageId);
    }

    /**
     * 获取与指定用户的消息列表（分页）
     * 按时间倒序排列，最新的消息在前
     *
     * @param contactId 联系人用户ID
     * @param pageNum   页码，默认 1
     * @param pageSize  每页大小，默认 20
     * @return 消息列表
     */
    @GetMapping("/history/{contactId}")
    @PreAuthorize("isAuthenticated()")
    public Result<PageResult<UserMessageVO>> getMessageHistory(
            @PathVariable Long contactId,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize) {
        Long currentUserId = authService.getCurrentUserId();

        List<UserMessageVO> messages = userMessageService.pageMessages(
                currentUserId, contactId, pageNum, pageSize);
        long total = userMessageService.countMessages(currentUserId, contactId);

        return Result.success(PageResult.of(messages, total, pageNum, pageSize));
    }

    /**
     * 获取会话列表（最近联系人）
     * 每个会话展示最后一条消息和未读数量
     *
     * @param pageNum  页码，默认 1
     * @param pageSize 每页大小，默认 20
     * @return 会话列表
     */
    @GetMapping("/conversations")
    @PreAuthorize("isAuthenticated()")
    public Result<PageResult<ConversationVO>> getConversations(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize) {
        Long currentUserId = authService.getCurrentUserId();

        List<ConversationVO> conversations = userMessageService.listConversations(
                currentUserId, pageNum, pageSize);
        long total = userMessageService.countConversations(currentUserId);

        return Result.success(PageResult.of(conversations, total, pageNum, pageSize));
    }

    /**
     * 撤回指定消息
     * 仅支持撤回自己发送的、2分钟内的消息
     *
     * @param messageId 消息ID
     * @return 是否成功
     */
    @PostMapping("/recall/{messageId}")
    @PreAuthorize("isAuthenticated()")
    public Result<Boolean> recallMessage(@PathVariable Long messageId) {
        Long currentUserId = authService.getCurrentUserId();
        userMessageService.recallMessage(currentUserId, messageId);
        return Result.success(true);
    }

    /**
     * 标记与指定用户的所有消息为已读
     *
     * @param contactId 联系人用户ID
     * @return 是否成功
     */
    @PostMapping("/read/{contactId}")
    @PreAuthorize("isAuthenticated()")
    public Result<Boolean> markAsRead(@PathVariable Long contactId) {
        Long currentUserId = authService.getCurrentUserId();
        userMessageService.markAsRead(currentUserId, contactId);
        return Result.success(true);
    }

    /**
     * 获取未读消息数量
     *
     * @return 未读消息总数
     */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public Result<Long> getUnreadCount() {
        Long currentUserId = authService.getCurrentUserId();
        long count = userMessageService.countUnreadMessages(currentUserId);
        return Result.success(count);
    }

    /**
     * 获取与指定联系人的未读消息数量
     *
     * @param contactId 联系人用户ID
     * @return 未读消息数
     */
    @GetMapping("/unread-count/{contactId}")
    @PreAuthorize("isAuthenticated()")
    public Result<Long> getUnreadCountWithContact(@PathVariable Long contactId) {
        Long currentUserId = authService.getCurrentUserId();
        long count = userMessageService.getUnreadCountWithContact(currentUserId, contactId);
        return Result.success(count);
    }

    /**
     * 检查与指定用户是否互相关注（是否可以发送消息）
     *
     * @param userId 目标用户ID
     * @return true 表示互相关注，可以发送消息
     */
    @GetMapping("/can-chat/{userId}")
    @PreAuthorize("isAuthenticated()")
    public Result<Boolean> canChatWith(@PathVariable Long userId) {
        Long currentUserId = authService.getCurrentUserId();
        boolean canChat = userMessageService.isMutualFollowing(currentUserId, userId);
        return Result.success(canChat);
    }
}
