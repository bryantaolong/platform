package com.bryan.platform.job;

import com.bryan.platform.config.properties.job.UserProfileUpdateJobProperties;
import com.bryan.platform.mapper.user.UserMapper;
import com.bryan.platform.service.user.UserInterestProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 用户画像定时更新任务
 * 定期更新所有活跃用户的兴趣画像
 *
 * @author Bryan Long
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserProfileUpdateJob {

    private final UserInterestProfileService userInterestProfileService;
    private final UserMapper userMapper;
    private final UserProfileUpdateJobProperties properties;

    /**
     * 批量更新所有活跃用户画像
     * 执行时间和参数可通过配置调整
     */
    @Scheduled(cron = "${job.user-profile-update.cron}")
    public void updateAllUserProfiles() {
        if (!properties.isEnabled()) {
            log.info("用户画像更新任务已禁用，跳过执行");
            return;
        }

        log.info("开始批量更新用户画像任务");

        // 1. 获取所有活跃用户ID（最近N天有登录行为的用户）
        List<Long> activeUserIds = userMapper.selectActiveUserIds(properties.getActiveUserDays());

        if (activeUserIds.isEmpty()) {
            log.info("没有活跃用户需要更新画像");
            return;
        }

        log.info("开始更新 {} 个活跃用户的画像", activeUserIds.size());

        // 2. 分批处理，避免内存溢出
        int batchSize = properties.getBatchSize();
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
