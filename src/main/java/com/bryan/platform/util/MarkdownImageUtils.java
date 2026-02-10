package com.bryan.platform.common.util;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Markdown图片处理工具类
 * 提供从Markdown内容中提取图片URL的方法。
 */
public class MarkdownImageUtils {

    /**
     * Markdown图片语法正则表达式
     * 匹配格式: ![alt text](/uploads/post-images/xxx.png)
     * 或: ![alt text](https://example.com/image.png)
     */
    private static final Pattern MARKDOWN_IMAGE_PATTERN = Pattern.compile(
            "!\\[(?:[^\\]]*)\\]\\(([^\\)]+)\\)"
    );

    /**
     * 从Markdown内容中提取所有图片URL
     *
     * @param content Markdown内容
     * @return 图片URL集合
     */
    public static Set<String> extractImageUrls(String content) {
        Set<String> imageUrls = new HashSet<>();
        if (content == null || content.isEmpty()) {
            return imageUrls;
        }

        Matcher matcher = MARKDOWN_IMAGE_PATTERN.matcher(content);
        while (matcher.find()) {
            String imageUrl = matcher.group(1);
            if (imageUrl != null && !imageUrl.isEmpty()) {
                imageUrls.add(imageUrl.trim());
            }
        }

        return imageUrls;
    }

    /**
     * 从Markdown内容中提取本地图片路径（以/uploads/开头的路径）
     *
     * @param content Markdown内容
     * @return 本地图片相对路径集合（去掉/uploads/前缀）
     */
    public static Set<String> extractLocalImagePaths(String content) {
        Set<String> localPaths = new HashSet<>();
        Set<String> allUrls = extractImageUrls(content);

        for (String url : allUrls) {
            // 处理以 /uploads/ 开头的本地图片路径
            if (url.startsWith("/uploads/")) {
                // 去掉 /uploads/ 前缀，得到相对路径
                String relativePath = url.substring("/uploads/".length());
                localPaths.add(relativePath);
            }
        }

        return localPaths;
    }
}
