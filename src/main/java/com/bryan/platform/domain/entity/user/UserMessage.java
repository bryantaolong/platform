package com.bryan.platform.domain.entity.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户私信消息实体
 * 记录用户之间的私信消息，仅支持相互关注的用户发送消息
 *
 * @author Bryan Long
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserMessage implements Serializable {

    private Long id;

    /**
     * 发送者ID
     */
    private Long senderId;

    /**
     * 接收者ID
     */
    private Long receiverId;

    /**
     * 消息内容（纯文本）
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

    /** 逻辑删除 */
    private Integer deleted;

    /** 乐观锁 */
    private Integer version;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;

    /** 创建人 */
    private String createdBy;

    /** 更新人 */
    private String updatedBy;
}
