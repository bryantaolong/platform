package com.bryan.platform.config.properties.job;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 僵尸图片清理任务配置属性类
 * 用于定时清理未被任何文章引用的上传图片（僵尸文件）
 *
 * @author Bryan Long
 */
@Setter
@Getter
@Component
@ConfigurationProperties(prefix = "job.orphan-image-cleanup")
public class OrphanImageCleanupJobProperties {

    /**
     * Cron 表达式，控制任务执行时间
     * 默认每天凌晨3点执行
     */
    private String cron = "0 0 3 * * ?";

    /**
     * 是否启用该任务
     * 默认 true
     */
    private boolean enabled = true;

    /**
     * 僵尸文件保留时间（天）
     * 超过此时间未引用的文件将被清理
     * 默认 7 天，给用户留出发布文章的时间
     */
    private int orphanFileAgeDays = 7;

    /**
     * 博文图片上传目录（相对路径）
     * 默认 ./uploads/post-images
     */
    private String uploadDir = "./uploads/post-images";

}
