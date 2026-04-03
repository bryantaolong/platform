package com.bryan.platform.service.algorithm;

import com.bryan.platform.config.properties.PostHotRankAlgorithmProperties;
import com.bryan.platform.domain.entity.algorithm.PostHotRankAlgorithm;
import com.bryan.platform.exception.BusinessException;
import com.bryan.platform.mapper.algorithm.PostHotRankAlgorithmMapper;
import com.bryan.platform.service.redis.RedisHashService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PostHotRankAlgorithmService
 * 热度算法权重配置服务
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HotRankAlgorithmService {

    private static final String ALGO_WEIGHTS_KEY = "algo:weights";
    private final PostHotRankAlgorithmMapper postHotRankAlgorithmMapper;
    private final RedisHashService redisHashService;
    private final PostHotRankAlgorithmProperties properties;

    /**
     * 查询全部算法权重配置
     *
     * @return 权重配置列表
     */
    public List<PostHotRankAlgorithm> listAll() {
        return postHotRankAlgorithmMapper.selectAll();
    }

    /**
     * 更新单个指标的权重值，并同步到 Redis 与内存配置
     *
     * @param id          主键
     * @param metricValue 权重值
     * @return 更新后的实体
     */
    @Transactional
    public PostHotRankAlgorithm updateWeight(Long id, BigDecimal metricValue) {
        PostHotRankAlgorithm existing = postHotRankAlgorithmMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException("热度算法权重配置不存在，ID=" + id);
        }
        existing.setMetricValue(metricValue);
        int rows = postHotRankAlgorithmMapper.update(existing);
        if (rows <= 0) {
            throw new BusinessException("更新热度算法权重失败，ID=" + id);
        }

        // 重新加载全部权重到 Redis 与内存配置，保持与启动逻辑一致
        List<PostHotRankAlgorithm> all = postHotRankAlgorithmMapper.selectAll();
        Map<String, Double> weightMap = new HashMap<>();
        for (PostHotRankAlgorithm w : all) {
            if (w.getMetricKey() != null && w.getMetricValue() != null) {
                double value = w.getMetricValue().doubleValue();
                redisHashService.set(ALGO_WEIGHTS_KEY, w.getMetricKey(), value);
                weightMap.put(w.getMetricKey(), value);
            }
        }
        properties.setWeights(weightMap);
        log.info("更新热度算法权重成功，ID={}，metricKey={}，metricValue={}", id, existing.getMetricKey(), metricValue);
        return existing;
    }
}
