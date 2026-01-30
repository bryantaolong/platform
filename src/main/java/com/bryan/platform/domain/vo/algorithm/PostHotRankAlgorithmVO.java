package com.bryan.platform.domain.vo.algorithm;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * PostHotRankAlgorithmVO
 * 热度算法权重配置视图对象
 *
 * @author Bryan Long
 */
@Data
@Builder
public class PostHotRankAlgorithmVO {

    private Long id;

    /**
     * 指标名称，如 view、like、comment、collect、share、decay_lambda、manual
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
}

