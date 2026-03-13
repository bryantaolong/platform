package com.bryan.platform.service.user;

import com.bryan.platform.domain.entity.user.SysUser;
import com.bryan.platform.domain.entity.user.UserFollow;
import com.bryan.platform.domain.entity.user.UserMessage;
import com.bryan.platform.domain.entity.user.UserProfile;
import com.bryan.platform.domain.vo.user.ConversationVO;
import com.bryan.platform.domain.vo.user.UserMessageVO;
import com.bryan.platform.exception.BusinessException;
import com.bryan.platform.mapper.user.UserFollowMapper;
import com.bryan.platform.mapper.user.UserMessageMapper;
import com.bryan.platform.mapper.user.UserProfileMapper;
import com.bryan.platform.util.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 用户私信消息服务类
 * 提供用户之间发送私信、查询消息、撤回消息等功能
 * 仅支持相互关注的用户之间发送消息
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserMessageService {

    private final UserMessageMapper userMessageMapper;
    private final UserFollowMapper userFollowMapper;
    private final UserService userService;
    private final UserProfileMapper userProfileMapper;

    /**
     * 消息撤回时间限制（分钟）
     */
    private static final int RECALL_TIME_LIMIT_MINUTES = 2;

    /**
     * 消息状态：正常
     */
    private static final int MESSAGE_STATUS_NORMAL = 0;

    /**
     * 消息状态：已撤回
     */
    private static final int MESSAGE_STATUS_RECALLED = 1;

    /**
     * 已读状态：未读
     */
    private static final int READ_STATUS_UNREAD = 0;

    /**
     * 已读状态：已读
     */
    private static final int READ_STATUS_READ = 1;

    /**
     * 发送私信
     * 仅支持相互关注的用户之间发送消息
     *
     * @param senderId   发送者ID
     * @param receiverId 接收者ID
     * @param content    消息内容
     * @return 创建的消息ID
     */
    @Transactional(rollbackFor = Exception.class)
    public Long sendMessage(Long senderId, Long receiverId, String content) {
        // 1. 校验用户存在
        if (!userService.existsById(senderId)) {
            throw new BusinessException("发送者用户不存在");
        }
        if (!userService.existsById(receiverId)) {
            throw new BusinessException("接收者用户不存在");
        }

        // 2. 不能给自己发送消息
        if (senderId.equals(receiverId)) {
            throw new BusinessException("不能给自己发送消息");
        }

        // 3. 检查是否互相关注
        if (!isMutualFollowing(senderId, receiverId)) {
            throw new BusinessException("只能与互相关注的用户发送消息");
        }

        // 4. 创建消息
        UserMessage message = UserMessage.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .content(content)
                .status(MESSAGE_STATUS_NORMAL)
                .readStatus(READ_STATUS_UNREAD)
                .build();
        this.fillInsert(message);

        userMessageMapper.insert(message);
        log.info("用户 {} 向用户 {} 发送消息成功，消息ID: {}", senderId, receiverId, message.getId());

        return message.getId();
    }

    /**
     * 分页获取与某用户的消息列表
     *
     * @param currentUserId 当前用户ID
     * @param contactId     联系人ID
     * @param pageNum       页码（从1开始）
     * @param pageSize      每页大小
     * @return 消息VO列表
     */
    public List<UserMessageVO> pageMessages(Long currentUserId, Long contactId,
                                            Integer pageNum, Integer pageSize) {
        long offset = (long) (pageNum - 1) * pageSize;

        List<UserMessage> messages = userMessageMapper.selectPageBetweenUsers(
                currentUserId, contactId, offset, pageSize);

        // 获取相关用户信息
        Map<Long, SysUser> userMap = getUserMap(currentUserId, contactId);
        Map<Long, UserProfile> profileMap = getProfileMap(currentUserId, contactId);

        return messages.stream()
                .map(msg -> convertToVO(msg, userMap, profileMap))
                .collect(Collectors.toList());
    }

    /**
     * 获取与某用户的消息总数
     */
    public long countMessages(Long currentUserId, Long contactId) {
        return userMessageMapper.countBetweenUsers(currentUserId, contactId);
    }

    /**
     * 获取会话列表（最近联系人）
     *
     * @param currentUserId 当前用户ID
     * @param pageNum       页码
     * @param pageSize      每页大小
     * @return 会话列表
     */
    public List<ConversationVO> listConversations(Long currentUserId,
                                                  Integer pageNum, Integer pageSize) {
        long offset = (long) (pageNum - 1) * pageSize;

        List<UserMessage> conversations = userMessageMapper.selectConversationList(
                currentUserId, offset, pageSize);

        return conversations.stream()
                .map(msg -> {
                    // 确定联系人ID
                    Long contactId = msg.getSenderId().equals(currentUserId)
                            ? msg.getReceiverId()
                            : msg.getSenderId();

                    // 获取联系人信息
                    SysUser contactUser = userService.getUserById(contactId);
                    UserProfile contactProfile = userProfileMapper.selectByUserId(contactId);

                    // 获取未读数量
                    long unreadCount = userMessageMapper.countUnreadBetweenUsers(currentUserId, contactId);

                    return ConversationVO.builder()
                            .contactId(contactId)
                            .contactUsername(contactUser != null ? contactUser.getUsername() : "")
                            .contactAvatar(contactProfile != null ? contactProfile.getAvatar() : null)
                            .lastMessageContent(msg.getContent())
                            .lastMessageStatus(msg.getStatus())
                            .lastMessageTime(msg.getCreatedAt())
                            .lastMessageSenderId(msg.getSenderId())
                            .unreadCount(unreadCount)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取会话总数
     */
    public long countConversations(Long currentUserId) {
        return userMessageMapper.countConversations(currentUserId);
    }

    /**
     * 撤回消息
     * 仅支持发送者在2分钟内撤回消息
     *
     * @param userId    当前用户ID
     * @param messageId 消息ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void recallMessage(Long userId, Long messageId) {
        UserMessage message = userMessageMapper.selectById(messageId);
        if (message == null) {
            throw new BusinessException("消息不存在");
        }

        // 检查是否是发送者
        if (!message.getSenderId().equals(userId)) {
            throw new BusinessException("只能撤回自己发送的消息");
        }

        // 检查消息状态
        if (message.getStatus() == MESSAGE_STATUS_RECALLED) {
            throw new BusinessException("消息已被撤回");
        }

        // 检查是否在2分钟内
        LocalDateTime now = LocalDateTime.now();
        long minutesSinceSent = ChronoUnit.MINUTES.between(message.getCreatedAt(), now);
        if (minutesSinceSent > RECALL_TIME_LIMIT_MINUTES) {
            throw new BusinessException("消息发送超过2分钟，无法撤回");
        }

        // 执行撤回
        int rows = userMessageMapper.updateRecallStatus(
                messageId,
                MESSAGE_STATUS_RECALLED,
                now,
                message.getVersion(),
                now,
                JwtUtils.getCurrentUsername()
        );

        if (rows == 0) {
            throw new BusinessException("撤回失败，请稍后重试");
        }

        log.info("用户 {} 撤回消息 {} 成功", userId, messageId);
    }

    /**
     * 标记与某用户的所有消息为已读
     *
     * @param userId    当前用户ID
     * @param contactId 联系人ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void markAsRead(Long userId, Long contactId) {
        LocalDateTime now = LocalDateTime.now();
        userMessageMapper.updateReadStatusByContact(userId, contactId, now);
        log.debug("用户 {} 标记与 {} 的消息为已读", userId, contactId);
    }

    /**
     * 获取用户未读消息总数
     *
     * @param userId 用户ID
     * @return 未读消息数量
     */
    public long countUnreadMessages(Long userId) {
        return userMessageMapper.countUnreadByReceiverId(userId);
    }

    /**
     * 获取与指定联系人的未读消息数量
     *
     * @param userId    当前用户ID
     * @param contactId 联系人ID
     * @return 未读消息数量
     */
    public long getUnreadCountWithContact(Long userId, Long contactId) {
        return userMessageMapper.countUnreadBetweenUsers(userId, contactId);
    }

    /**
     * 检查两个用户是否互相关注
     *
     * @param userId1 用户1
     * @param userId2 用户2
     * @return 是否互相关注
     */
    public boolean isMutualFollowing(Long userId1, Long userId2) {
        // userId1 关注 userId2
        boolean user1FollowsUser2 = userFollowMapper.countByFollowerIdAndFollowingId(userId1, userId2) > 0;
        // userId2 关注 userId1
        boolean user2FollowsUser1 = userFollowMapper.countByFollowerIdAndFollowingId(userId2, userId1) > 0;

        return user1FollowsUser2 && user2FollowsUser1;
    }

    /**
     * 转换消息实体为VO
     */
    private UserMessageVO convertToVO(UserMessage message,
                                      Map<Long, SysUser> userMap,
                                      Map<Long, UserProfile> profileMap) {
        SysUser sender = userMap.get(message.getSenderId());
        SysUser receiver = userMap.get(message.getReceiverId());
        UserProfile senderProfile = profileMap.get(message.getSenderId());
        UserProfile receiverProfile = profileMap.get(message.getReceiverId());

        return UserMessageVO.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .senderUsername(sender != null ? sender.getUsername() : "")
                .senderAvatar(senderProfile != null ? senderProfile.getAvatar() : null)
                .receiverId(message.getReceiverId())
                .receiverUsername(receiver != null ? receiver.getUsername() : "")
                .receiverAvatar(receiverProfile != null ? receiverProfile.getAvatar() : null)
                .content(message.getContent())
                .status(message.getStatus())
                .readStatus(message.getReadStatus())
                .readAt(message.getReadAt())
                .recalledAt(message.getRecalledAt())
                .createdAt(message.getCreatedAt())
                .build();
    }

    /**
     * 获取用户Map
     */
    private Map<Long, SysUser> getUserMap(Long... userIds) {
        List<Long> idList = List.of(userIds);
        List<SysUser> users = userService.getUsersByIds(idList);
        return users.stream()
                .collect(Collectors.toMap(SysUser::getId, u -> u));
    }

    /**
     * 获取用户资料Map
     */
    private Map<Long, UserProfile> getProfileMap(Long... userIds) {
        Map<Long, UserProfile> map = new java.util.HashMap<>();
        for (Long userId : userIds) {
            UserProfile profile = userProfileMapper.selectByUserId(userId);
            if (profile != null) {
                map.put(userId, profile);
            }
        }
        return map;
    }

    /**
     * 填充插入字段
     */
    private void fillInsert(UserMessage message) {
        LocalDateTime now = LocalDateTime.now();
        Long operator = JwtUtils.getCurrentUserId();

        message.setDeleted(0);
        message.setVersion(0);
        message.setCreatedAt(now);
        message.setUpdatedAt(now);
        message.setUpdatedBy(operator != null ? operator.toString() : null);
        message.setCreatedBy(operator != null ? operator.toString() : null);
    }
}
