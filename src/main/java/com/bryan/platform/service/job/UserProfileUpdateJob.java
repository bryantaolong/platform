package com.bryan.platform.service.job;

import com.bryan.platform.mapper.user.UserMapper;
import com.bryan.platform.service.user.UserInterestProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 用户画像定时更新任务
 * 每天凌晨2点更新所有活跃用户的画像
 *
 * @author Bryan Long
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserProfileUpdateJob {

    private final UserInterestProfileService userInterestProfileService;
    private final UserMapper userMapper;

    /**
     * 批量更新所有活跃用户画像
     * 每天凌晨2点执行
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void updateAllUserProfiles() {
        log.info("开始批量更新用户画像任务");

        // 1. 获取所有活跃用户ID（最近30天有登录行为的用户）
        List<Long> activeUserIds = userMapper.selectActiveUserIds(30);

        if (activeUserIds.isEmpty()) {
            log.info("没有活跃用户需要更新画像");
            return;
        }

        log.info("开始更新 {} 个活跃用户的画像", activeUserIds.size());

        // 2. 分批处理，每批100人，避免内存溢出
        int batchSize = 100;
        int totalProcessed = 0;
        int totalSuccess = 0;
        int totalFailed = 0;

        for (int i = 0; i < activeUserIds.size(); i += batchSize) {
            List<Long> batch = activeUserIds.subList(
                    i,
                    Math.min(i + batchSize, activeUserIds.size())
            );

            try {
                userInterestProfileService.batchUpdateProfiles(batch);
                totalSuccess += batch.size();
            } catch (Exception e) {
                log.error("批量更新用户画像失败，当前批次: {}", batch, e);
                totalFailed += batch.size();
            }

            totalProcessed += batch.size();
            log.info("用户画像更新进度: {}/{}", totalProcessed, activeUserIds.size());
        }

        log.info("用户画像批量更新任务完成，成功: {}, 失败: {}", totalSuccess, totalFailed);
    }

    /**
     * 更新指定用户的画像（手动触发）
     *
     * @param userId 用户ID
     */
    public void updateSingleUserProfile(Long userId) {
        log.info("手动更新用户画像，用户ID: {}", userId);
        userInterestProfileService.updateUserProfile(userId);
    }
}
