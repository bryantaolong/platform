package com.bryan.platform.config.loader;

import com.bryan.platform.service.post.PostHotRankService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PostHotRankCacheWarmUpRunner implements ApplicationRunner {

    private final PostHotRankService postHotRankService;

    private static final List<Integer> WARM_UP_LIMITS = List.of(10, 20, 50, 100);

    @Override
    public void run(ApplicationArguments args) {
        log.info("开始预热热点帖子缓存...");
        try {
            postHotRankService.warmUp(WARM_UP_LIMITS);
            log.info("热点帖子缓存预热完成");
        } catch (Exception e) {
            log.error("热点帖子缓存预热失败", e);
        }
    }
}
