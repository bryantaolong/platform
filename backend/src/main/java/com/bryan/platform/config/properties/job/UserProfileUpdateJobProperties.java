package com.bryan.platform.config.properties.job;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 用户画像更新任务配置属性类
 * 用于定时更新用户兴趣画像的配置
 *
 * @author Bryan Long
 */
@Setter
@Getter
@Component
@ConfigurationProperties(prefix = "job.user-profile-update")
public class UserProfileUpdateJobProperties {

    /**
     * Cron 表达式，控制任务执行时间
     * 默认每天凌晨2点执行
     */
    private String cron = "0 0 2 * * ?";

    /**
     * 是否启用该任务
     * 默认 true
     */
    private boolean enabled = true;

    /**
     * 活跃用户时间窗口（天）
     * 查询最近多少天内有登录行为的用户视为活跃用户
     * 默认 30 天
     */
    private int activeUserDays = 30;

    /**
     * 批量处理大小
     * 每次更新多少个用户的画像，避免内存溢出
     * 默认 100
     */
    private int batchSize = 100;

}
