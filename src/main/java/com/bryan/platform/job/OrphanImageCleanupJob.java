package com.bryan.platform.job;

import com.bryan.platform.config.properties.job.OrphanImageCleanupJobProperties;
import com.bryan.platform.mapper.post.PostMapper;
import com.bryan.platform.service.file.LocalFileService;
import com.bryan.platform.util.MarkdownImageUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 僵尸图片清理定时任务
 * 定期清理未被任何文章引用的上传图片（僵尸文件）
 *
 * @author Bryan Long
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrphanImageCleanupJob {

    private final PostMapper postMapper;
    private final LocalFileService localFileService;
    private final OrphanImageCleanupJobProperties properties;

    /**
     * 清理僵尸图片任务
     * 执行时间和参数可通过配置调整
     */
    @Scheduled(cron = "${job.orphan-image-cleanup.cron}")
    public void cleanupOrphanImages() {
        if (!properties.isEnabled()) {
            log.info("僵尸图片清理任务已禁用，跳过执行");
            return;
        }

        log.info("开始执行僵尸图片清理任务");

        try {
            // 1. 收集所有文章中被引用的图片路径
            Set<String> referencedImages = collectAllReferencedImages();

            log.info("扫描到 {} 个被文章引用的图片", referencedImages.size());

            // 2. 扫描上传目录，清理未被引用的文件
            int deletedCount = scanAndCleanupOrphanFiles(referencedImages);

            log.info("僵尸图片清理任务完成，共删除 {} 个僵尸文件", deletedCount);

        } catch (Exception e) {
            log.error("僵尸图片清理任务执行失败", e);
        }
    }

    /**
     * 收集所有未被删除文章中被引用的图片路径
     *
     * @return 被引用的图片路径集合
     */
    private Set<String> collectAllReferencedImages() {
        Set<String> referencedImages = new HashSet<>();

        // 查询所有未被删除的文章内容（包括草稿、已发布、已审核等）
        List<String> allPostContents = postMapper.selectAllPostContents();

        for (String content : allPostContents) {
            if (content != null && !content.trim().isEmpty()) {
                Set<String> images = MarkdownImageUtils.extractLocalImagePaths(content);
                referencedImages.addAll(images);
            }
        }

        return referencedImages;
    }

    /**
     * 扫描上传目录，删除未被引用的文件
     *
     * @param referencedImages 被引用的图片路径集合
     * @return 删除的文件数量
     */
    private int scanAndCleanupOrphanFiles(Set<String> referencedImages) {
        int deletedCount = 0;

        File uploadDir = new File(properties.getUploadDir());
        if (!uploadDir.exists() || !uploadDir.isDirectory()) {
            log.warn("图片上传目录不存在或不是目录: {}", properties.getUploadDir());
            return 0;
        }

        File[] files = uploadDir.listFiles();
        if (files == null) {
            log.warn("无法读取上传目录内容: {}", properties.getUploadDir());
            return 0;
        }

        // 计算文件保留截止时间（仅清理超过指定天数且未被引用的文件）
        long cutoffTime = System.currentTimeMillis() -
                (properties.getOrphanFileAgeDays() * 24L * 60 * 60 * 1000);

        for (File file : files) {
            if (file.isFile()) {
                // 获取文件相对于 uploadDir 的相对路径（如：post-images/xxx.png）
                String relativePath = uploadDir.toPath()
                        .relativize(file.toPath())
                        .toString()
                        .replace("\\", "/");  // 统一为正斜杠

                // 如果文件未被任何文章引用，且超过保留期限，则删除
                if (!referencedImages.contains(relativePath)) {
                    if (file.lastModified() < cutoffTime) {
                        boolean deleted = localFileService.deleteFile(relativePath);
                        if (deleted) {
                            log.info("删除僵尸图片: {}", relativePath);
                            deletedCount++;
                        } else {
                            log.warn("删除僵尸图片失败或文件不存在: {}", relativePath);
                        }
                    } else {
                        log.debug("图片 {} 未被引用但未超过保留期限，跳过", relativePath);
                    }
                }
            }
        }

        return deletedCount;
    }

}
