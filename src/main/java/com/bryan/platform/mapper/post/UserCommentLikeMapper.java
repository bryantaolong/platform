package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.UserCommentLike;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UserCommentLikeMapper
 *
 * @author Bryan Long
 */
@Mapper
public interface UserCommentLikeMapper {

    int insert(UserCommentLike record);

    int deleteByUserIdAndCommentId(@Param("userId") Long userId, @Param("commentId") Long commentId);

    UserCommentLike selectByUserIdAndCommentId(@Param("userId") Long userId, @Param("commentId") Long commentId);

    UserCommentLike selectByUserIdAndCommentIdIncludeDeleted(@Param("userId") Long userId, @Param("commentId") Long commentId);

    boolean existsByUserIdAndCommentId(@Param("userId") Long userId, @Param("commentId") Long commentId);

    boolean existsByUserIdAndCommentIdIncludeDeleted(@Param("userId") Long userId, @Param("commentId") Long commentId);

    int restoreLike(@Param("userId") Long userId, @Param("commentId") Long commentId);
}
