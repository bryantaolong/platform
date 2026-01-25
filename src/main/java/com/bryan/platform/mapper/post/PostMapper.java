package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.enums.post.PostStatusEnum;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * PostMapper
 *
 * @author Bryan Long
 */
@Mapper
public interface PostMapper {

    /* ---------- 增 ---------- */
    int insert(Post record);

    /* ---------- 删 ---------- */
    int deleteById(@Param("id") Long id);

    /* ---------- 改 ---------- */
    int update(Post record);

    int updateLikeCount(@Param("id") Long id, @Param("delta") int delta);

    int updateCollectCount(@Param("id") Long id, @Param("delta") int delta);

    int updateViewCount(@Param("id") Long id, @Param("delta") int delta);

    int updateCommentCount(@Param("id") Long id, @Param("delta") int delta);

    /* ---------- 查 ---------- */
    Post selectById(@Param("id") Long id);

    List<Post> selectByIds(@Param("ids") List<Long> ids);

    List<Post> selectByUserId(@Param("userId") Long userId,
                              @Param("offset") int offset,
                              @Param("pageSize") int pageSize);

    List<Post> selectByUserIdAndStatus(@Param("userId") Long userId,
                                       @Param("status") PostStatusEnum status,
                                       @Param("offset") int offset,
                                       @Param("pageSize") int pageSize);

    List<Post> selectPage(@Param("offset") int offset,
                          @Param("pageSize") int pageSize);

    List<Post> selectPageByStatus(@Param("status") PostStatusEnum status,
                                  @Param("offset") int offset,
                                  @Param("pageSize") int pageSize);

    List<Post> selectByTitle(@Param("title") String title,
                              @Param("status") PostStatusEnum status,
                              @Param("offset") int offset,
                              @Param("pageSize") int pageSize);

    List<Post> selectBySearch(@Param("title") String title,
                              @Param("author") String author,
                              @Param("tags") String tags,
                              @Param("status") PostStatusEnum status,
                              @Param("offset") int offset,
                              @Param("pageSize") int pageSize);

    /* ---------- 计数 ---------- */
    long countByUserId(@Param("userId") Long userId);

    long countByStatus(@Param("status") PostStatusEnum status);

    long countByUserIdAndStatus(@Param("userId") Long userId,
                                @Param("status") PostStatusEnum status);

    long countAll();

    long countByTitle(@Param("title") String title,
                       @Param("status") PostStatusEnum status);

    long countBySearch(@Param("title") String title,
                       @Param("author") String author,
                       @Param("tags") String tags,
                       @Param("status") PostStatusEnum status);
}
