package com.bryan.platform.domain.request.post;

import com.bryan.platform.domain.enums.post.PostStatusEnum;
import jakarta.validation.constraints.Size;
import lombok.Getter;

/**
 * AdminPostSearchRequest
 *
 * @author Bryan Long
 */
@Getter
public class PostSearchRequest {
    /**
     * 文章标题。
     * 可选，如果提供则更新，长度限制为1-100个字符。
     */
    @Size(min = 1, max = 100, message = "标题长度应在1-100个字符之间")
    private String title;

    /**
     * 文章作者。
     * 可选，如果提供则更新，至少需要10个字符。
     */
    @Size(min = 10, message = "文章作者至少需要10个字符")
    private String author;

    /**
     * 标签列表。
     * 可选，如果提供则更新，最多10个标签，每个标签长度1-20个字符。
     */
    @Size(max = 10, message = "标签数量不能超过10个")
//    private List<@Size(min = 1, max = 20, message = "每个标签长度应在1-20个字符之间") String> tags;
    private String tags;

    private PostStatusEnum status;
}
