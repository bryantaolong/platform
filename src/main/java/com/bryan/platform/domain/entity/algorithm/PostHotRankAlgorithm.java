package com.bryan.platform.domain.entity.algorithm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * PostHotRankAlgorithm
 * 帖子热度算法权重配置实体
 *
 * @author Bryan Long
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostHotRankAlgorithm implements Serializable {

    private Long id;

    /**
     * 指标名称，如 view、like、comment、collect、share、decay、manual
     */
    private String metricKey;

    /**
     * 权重值
     */
    private BigDecimal metricValue;

    /**
     * 说明
     */
    private String description;

    /* ======== 通用字段 ======== */
    private Integer deleted;

    private Integer version;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;

    private String updatedBy;
}
