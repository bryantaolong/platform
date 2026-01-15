package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.UserPostCollect;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UserPostCollectMapper
 *
 * @author Bryan Long
 */
@Mapper
public interface UserPostCollectMapper {

    /* ---------- 增 ---------- */
    int insert(UserPostCollect record);

    /* ---------- 删 ---------- */
    int deleteById(@Param("id") Long id);

    int deleteByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    /* ---------- 改 ---------- */
    int update(UserPostCollect record);

    /* ---------- 查 ---------- */
    UserPostCollect selectById(@Param("id") Long id);

    UserPostCollect selectByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    List<UserPostCollect> selectByUserId(@Param("userId") Long userId,
                                         @Param("offset") int offset,
                                         @Param("pageSize") int pageSize);

    List<UserPostCollect> selectByUserIdAndCollectionId(@Param("userId") Long userId,
                                                        @Param("collectionId") Long collectionId,
                                                        @Param("offset") int offset,
                                                        @Param("pageSize") int pageSize);

    /* ---------- 计数 ---------- */
    long countByUserId(@Param("userId") Long userId);

    long countByUserIdAndCollectionId(@Param("userId") Long userId, @Param("collectionId") Long collectionId);

    boolean existsByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    boolean existsByUserIdAndPostIdIncludeDeleted(@Param("userId") Long userId, @Param("postId") Long postId);

    int restoreCollect(@Param("userId") Long userId, @Param("postId") Long postId);
}
