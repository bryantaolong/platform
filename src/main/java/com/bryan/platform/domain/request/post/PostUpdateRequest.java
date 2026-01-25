package com.bryan.platform.domain.request.post;

import jakarta.validation.constraints.*;
import lombok.Getter;

import java.util.List;

/**
 * 博客文章更新请求对象
 *
 * @author Bryan Long
 */
@Getter
public class PostUpdateRequest {

    /**
     * 文章ID。
     * 更新时必填，用于标识要更新的文章。
     */
    @NotNull(message = "文章ID不能为空")
    @Min(value = 1, message = "文章ID必须大于0")
    private Long id;

    /**
     * 文章标题。
     * 可选，如果提供则更新，长度限制为1-100个字符。
     */
    @Size(min = 1, max = 100, message = "标题长度应在1-100个字符之间")
    private String title;

    /**
     * 文章内容。
     * 可选，如果提供则更新，至少需要10个字符。
     */
    @Size(min = 10, message = "文章内容至少需要10个字符")
    private String content;

    /**
     * 分类ID。
     * 可选，如果提供则更新，必须大于0。
     */
    @Min(value = 1, message = "分类ID必须大于0")
    private Long categoryId;

    /**
     * 标签列表。
     * 可选，如果提供则更新，最多10个标签，每个标签长度1-20个字符。
     */
    @Size(max = 10, message = "标签数量不能超过10个")
    private List<@Size(min = 1, max = 20, message = "每个标签长度应在1-20个字符之间") String> tags;

    /**
     * 评论区状态。
     * 可选，如果提供则更新，用于控制评论功能（如：OPEN-开启, CLOSED-关闭, REVIEW-需审核）。
     */
    @Pattern(regexp = "^(OPEN|CLOSED|REVIEW)?$", message = "评论区状态只能是 OPEN、CLOSED 或 REVIEW")
    @Size(max = 20, message = "评论区状态长度不能超过20个字符")
    private String commentAreaStatus;
}