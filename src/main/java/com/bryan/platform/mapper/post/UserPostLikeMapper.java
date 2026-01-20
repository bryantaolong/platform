package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.UserPostLike;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface UserPostLikeMapper {

    int insert(UserPostLike record);

    int deleteById(@Param("id") Long id);

    int deleteByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    UserPostLike selectById(@Param("id") Long id);

    UserPostLike selectByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);
    UserPostLike selectByUserIdAndPostIdIncludeDeleted(@Param("userId") Long userId, @Param("postId") Long postId);

    boolean existsByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);
    boolean existsByUserIdAndPostIdIncludeDeleted(@Param("userId") Long userId, @Param("postId") Long postId);

    int restoreLike(@Param("userId") Long userId, @Param("postId") Long postId);

}
