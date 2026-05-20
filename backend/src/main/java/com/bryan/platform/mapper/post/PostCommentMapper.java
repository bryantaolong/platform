package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.PostComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 帖子评论Mapper接口
 * 提供帖子评论相关的数据库操作
 *
 * @author Bryan Long
 */
@Mapper
public interface PostCommentMapper {

    int insert(PostComment record);

    PostComment selectById(@Param("id") Long id);

    List<PostComment> selectByPostId(@Param("postId") Long postId);

    List<PostComment> selectByPostIdWithPage(@Param("postId") Long postId,
                                             @Param("offset") int offset,
                                             @Param("pageSize") int pageSize);

    List<PostComment> selectByRootId(@Param("rootId") Long rootId);

    List<PostComment> selectByParentId(@Param("parentId") Long parentId);

    long countByPostId(@Param("postId") Long postId);

    long countByRootId(@Param("rootId") Long rootId);

    int selectMaxFloorByPostId(@Param("postId") Long postId);

    List<PostComment> selectHotCommentsByPostId(@Param("postId") Long postId,
                                                @Param("limit") int limit);

    List<PostComment> selectLatestCommentsByPostId(@Param("postId") Long postId,
                                                   @Param("limit") int limit);

    List<PostComment> selectRepliesByCommentId(@Param("commentId") Long commentId,
                                               @Param("limit") int limit);

    List<PostComment> selectByPostIdWithUser(@Param("postId") Long postId);

    int increaseLikeCount(@Param("id") Long id, @Param("comment") PostComment comment);

    int increaseDislikeCount(@Param("id") Long id, @Param("comment") PostComment comment);

    int increaseChildCount(@Param("rootId") Long rootId, @Param("comment") PostComment comment);

    int updateById(PostComment comment);

    int deleteById(@Param("id") Long id,
                   @Param("version") Integer version,
                   @Param("updatedAt") java.time.LocalDateTime updatedAt,
                   @Param("updatedBy") String updatedBy);
}
