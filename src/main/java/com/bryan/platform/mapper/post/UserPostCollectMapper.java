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

    int insert(UserPostCollect record);

    UserPostCollect selectById(@Param("id") Long id);

    UserPostCollect selectByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    List<UserPostCollect> selectByUserId(@Param("userId") Long userId,
                                         @Param("offset") int offset,
                                         @Param("pageSize") int pageSize);

    List<UserPostCollect> selectByUserIdAndCollectionId(@Param("userId") Long userId,
                                                        @Param("collectionId") Long collectionId,
                                                        @Param("offset") int offset,
                                                        @Param("pageSize") int pageSize);

    long countByUserId(@Param("userId") Long userId);

    long countByUserIdAndCollectionId(@Param("userId") Long userId, @Param("collectionId") Long collectionId);

    boolean existsByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    boolean existsByUserIdAndPostIdIncludeDeleted(@Param("userId") Long userId, @Param("postId") Long postId);

    int restoreCollect(@Param("userId") Long userId, @Param("postId") Long postId);

    int update(UserPostCollect record);

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
