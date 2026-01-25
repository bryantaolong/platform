package com.bryan.platform.domain.request.post;

import jakarta.validation.constraints.*;
import lombok.Getter;

import java.util.List;

/**
 * 博客文章创建请求对象
 *
 * @author Bryan Long
 */
@Getter
public class PostCreateRequest {

    /**
     * 文章标题。
     * 必填，长度限制为1-100个字符。
     */
    @NotBlank(message = "文章标题不能为空")
    @Size(min = 1, max = 100, message = "标题长度应在1-100个字符之间")
    private String title;

    /**
     * 文章内容。
     * 必填，至少需要10个字符。
     */
    @NotBlank(message = "文章内容不能为空")
    @Size(min = 10, message = "文章内容至少需要10个字符")
    private String content;

    /**
     * 分类ID。
     * 可选，如果提供则必须是正数。
     */
    @Min(value = 1, message = "分类ID必须大于0")
    private Long categoryId;

    /**
     * 标签列表。
     * 可选，每个标签长度限制为1-20个字符，最多10个标签。
     */
    @Size(max = 10, message = "标签数量不能超过10个")
    private List<@Size(min = 1, max = 20, message = "每个标签长度应在1-20个字符之间") String> tags;
}