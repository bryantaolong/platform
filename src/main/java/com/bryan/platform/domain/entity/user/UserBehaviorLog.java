package com.bryan.platform.domain.entity.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户行为日志实体
 * 用于离线分析和推荐优化
 *
 * @author Bryan Long
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBehaviorLog implements Serializable {

    private Long id;

    private Long userId;

    private Long postId;

    private String behaviorType;

    private Integer durationSeconds;

    /* ======== 通用字段 ======== */
    private Integer deleted;

    private Integer version;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;

    private String updatedBy;
}
