package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.UserPostLike;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface UserPostLikeMapper {

    int insert(UserPostLike record);

    UserPostLike selectById(@Param("id") Long id);

    UserPostLike selectByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    UserPostLike selectByUserIdAndPostIdIncludeDeleted(@Param("userId") Long userId, @Param("postId") Long postId);

    boolean existsByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    boolean existsByUserIdAndPostIdIncludeDeleted(@Param("userId") Long userId, @Param("postId") Long postId);

    int restoreLike(@Param("userId") Long userId,
                    @Param("postId") Long postId,
                    @Param("version") Integer version,
                    @Param("updatedAt") java.time.LocalDateTime updatedAt,
                    @Param("updatedBy") String updatedBy);

    int deleteById(@Param("id") Long id,
                   @Param("version") Integer version,
                   @Param("updatedAt") java.time.LocalDateTime updatedAt,
                   @Param("updatedBy") String updatedBy);

    int deleteByUserIdAndPostId(@Param("userId") Long userId,
                                @Param("postId") Long postId,
                                @Param("version") Integer version,
                                @Param("updatedAt") java.time.LocalDateTime updatedAt,
                                @Param("updatedBy") String updatedBy);

    /* ---------- 推荐相关 ---------- */
    List<Long> selectPostIdsByUserId(@Param("userId") Long userId);
}
