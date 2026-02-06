package com.bryan.platform.domain.entity.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户兴趣画像实体
 * 存储用户的兴趣标签及权重
 *
 * @author Bryan Long
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileInterest implements Serializable {

    private Long id;

    private Long userId;

    private String interestTag;

    private Double weight;

    private String source;

    /* ======== 通用字段 ======== */
    private Integer deleted;

    private Integer version;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;

    private String updatedBy;
}
