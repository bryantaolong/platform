package com.bryan.platform.domain.vo.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户私信消息VO
 *
 * @author Bryan Long
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserMessageVO {

    private Long id;

    /**
     * 发送者ID
     */
    private Long senderId;

    /**
     * 发送者用户名
     */
    private String senderUsername;

    /**
     * 发送者头像
     */
    private String senderAvatar;

    /**
     * 接收者ID
     */
    private Long receiverId;

    /**
     * 接收者用户名
     */
    private String receiverUsername;

    /**
     * 接收者头像
     */
    private String receiverAvatar;

    /**
     * 消息内容
     */
    private String content;

    /**
     * 消息状态：0-正常，1-已撤回
     */
    private Integer status;

    /**
     * 是否已读：0-未读，1-已读
     */
    private Integer readStatus;

    /**
     * 已读时间
     */
    private LocalDateTime readAt;

    /**
     * 撤回时间
     */
    private LocalDateTime recalledAt;

    /**
     * 创建时间（发送时间）
     */
    private LocalDateTime createdAt;
}
