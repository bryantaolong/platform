package com.bryan.platform.domain.vo.post;

import com.bryan.platform.domain.enums.post.CommentAreaStatusEnum;
import com.bryan.platform.domain.enums.post.PostStatusEnum;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * PostSummaryVO - 用于列表展示的博文摘要VO
 * 包含内容预览而非完整内容，优化列表页数据传输
 *
 * @author Bryan Long
 */
@Data
@Builder
public class PostSummaryVO {

    private Long id;

    private Long userId;

    private String author;

    private String title;

    private String contentPreview;  // 内容预览，限制长度

    private PostStatusEnum status;

    private Long categoryId;

    private List<String> tags;

    private CommentAreaStatusEnum commentAreaStatus;

    // count numbers
    private Long viewCount;

    private Long likeCount;

    private Long commentCount;

    private Long collectCount;

    private Long shareCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
