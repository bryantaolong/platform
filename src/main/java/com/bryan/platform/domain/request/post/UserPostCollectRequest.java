package com.bryan.platform.domain.request.post;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

/**
 * 用户收藏文章请求对象
 *
 * @author Bryan Long
 */
@Getter
public class UserPostCollectRequest {
    /**
     * 文章ID。
     * 必填，用于标识要收藏的文章。
     */
    @NotNull(message = "文章ID不能为空")
    @Min(value = 1, message = "文章ID必须大于0")
    private Long postId;

    /**
     * 收藏夹ID。
     * 可选，用于指定收藏到特定收藏夹。默认为0，表示收藏到默认收藏夹。
     */
    @Min(value = 0, message = "收藏夹ID不能为负数")
    private Long collectionId;
}
