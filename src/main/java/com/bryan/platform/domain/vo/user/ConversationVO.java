package com.bryan.platform.domain.vo.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 会话列表项VO
 * 展示最近联系人及最后一条消息
 *
 * @author Bryan Long
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationVO {

    /**
     * 联系人用户ID
     */
    private Long contactId;

    /**
     * 联系人用户名
     */
    private String contactUsername;

    /**
     * 联系人头像
     */
    private String contactAvatar;

    /**
     * 最后一条消息内容
     */
    private String lastMessageContent;

    /**
     * 最后一条消息是否已撤回
     */
    private Integer lastMessageStatus;

    /**
     * 最后一条消息发送时间
     */
    private LocalDateTime lastMessageTime;

    /**
     * 最后一条消息发送者ID
     */
    private Long lastMessageSenderId;

    /**
     * 未读消息数量
     */
    private Long unreadCount;
}
