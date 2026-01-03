package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.Post;
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

    /* ---------- 查 ---------- */
    Post selectById(@Param("id") Long id);

    List<Post> selectByIds(@Param("ids") List<Long> ids);

    List<Post> selectByUserId(@Param("userId") Long userId,
                              @Param("offset") int offset,
                              @Param("pageSize") int pageSize);

    List<Post> selectPage(@Param("offset") int offset,
                          @Param("pageSize") int pageSize);

    /* ---------- 计数 ---------- */
    long countByUserId(@Param("userId") Long userId);

    long countAll();
}
