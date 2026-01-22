package com.bryan.platform.domain.converter;

import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.vo.post.PostVO;

/**
 * 博文实体与值对象转换器
 * 负责 Post 与 PostVO 之间的单向转换（entity → vo）。
 *
 * @author Bryan Long
 */
public class PostConverter {

    /**
     * 将博文实体转换为对外展示的 VO
     *
     * @param post 博文实体
     * @return 博文 VO；若入参为 null 则返回 null
     */
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
                .status(post.getStatus())
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