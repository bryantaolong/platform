package com.bryan.platform.domain.converter;

import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.vo.post.PostVO;

/**
 * PostConverter
 *
 * @author Bryan Long
 */
public class PostConverter {

    public static PostVO toPostVO(Post post) {
        if (post == null) {
            return null;
        }

        return PostVO.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .author(post.getCreatedBy())
                .title(post.getTitle())
                .content(post.getContent())
                .categoryId(post.getCategoryId())
                .tags(post.getTags())
                .commentAreaStatus(post.getCommentAreaStatus())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .collectCount(post.getCollectCount())
                .shareCount(post.getShareCount())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
