package com.bryan.platform.domain.entity.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * UserPostLike
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPostLike implements Serializable {

    private Long id;

    private Long userId;

    private Long postId;

    /* ======== 通用字段 ======== */
    private Integer deleted;

    private Integer version;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;

    private String updatedBy;

}
