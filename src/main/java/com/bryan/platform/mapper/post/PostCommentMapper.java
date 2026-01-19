package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.PostComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * PostCommentMapper
 *
 * @author Bryan Long
 */
@Mapper
public interface PostCommentMapper {

    int insert(PostComment record);

    int increaseLikeCount(Long id);

    int increaseDislikeCount(Long id);

    int increaseChildCount(Long rootId);

    int updateById(PostComment comment);

    int deleteById(Long id);

    PostComment selectById(Long id);

    List<PostComment> selectByPostId(Long postId);

    List<PostComment> selectByPostIdWithPage(Long postId, int offset, int pageSize);

    List<PostComment> selectByRootId(Long rootId);

    List<PostComment> selectByParentId(Long parentId);

    long countByPostId(Long postId);

    long countByRootId(Long rootId);

    int selectMaxFloorByRootId(Long rootId);

    List<PostComment> selectHotCommentsByPostId(Long postId, int limit);

    List<PostComment> selectLatestCommentsByPostId(Long postId, int limit);

    List<PostComment> selectRepliesByCommentId(Long commentId, int limit);

    List<PostComment> selectByPostIdWithUser(Long postId);
}
