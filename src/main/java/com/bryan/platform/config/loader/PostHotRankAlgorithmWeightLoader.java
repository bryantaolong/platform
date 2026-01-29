package com.bryan.platform.config.loader;

import com.bryan.platform.config.properties.PostHotRankAlgorithmProperties;
import com.bryan.platform.domain.entity.algorithm.PostHotRankAlgorithm;
import com.bryan.platform.mapper.algorithm.PostHotRankAlgorithmMapper;
import com.bryan.platform.service.redis.RedisHashService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PostHotRankAlgorithmWeightLoader
 * 应用启动时从数据库加载热度算法权重配置到内存和 Redis
 *
 * @author Bryan Long
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PostHotRankAlgorithmWeightLoader implements ApplicationRunner {

    private static final String ALGO_WEIGHTS_KEY = "algo:weights";

    private final PostHotRankAlgorithmMapper postHotRankAlgorithmMapper;

    private final RedisHashService redisHashService;

    private final PostHotRankAlgorithmProperties properties;

    @Override
    public void run(ApplicationArguments args) {
        List<PostHotRankAlgorithm> list = postHotRankAlgorithmMapper.selectAll();
        Map<String, Double> weightMap = new HashMap<>();
        for (PostHotRankAlgorithm w : list) {
            if (w.getMetricKey() != null && w.getMetricValue() != null) {
                redisHashService.set(ALGO_WEIGHTS_KEY, w.getMetricKey(), w.getMetricValue().doubleValue());
                weightMap.put(w.getMetricKey(), w.getMetricValue().doubleValue());
            }
        }
        properties.setWeights(weightMap);
        log.info("热度算法权重配置加载完成，共加载 {} 个配置项", weightMap.size());
    }
}
