package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.UserPostCollection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UserPostCollectionMapper
 *
 * @author Bryan Long
 */
@Mapper
public interface UserPostCollectionMapper {

    /* ---------- 增 ---------- */
    int insert(UserPostCollection record);

    /* ---------- 删 ---------- */
    int deleteById(@Param("id") Long id);

    /* ---------- 改 ---------- */
    int update(UserPostCollection record);

    /* ---------- 查 ---------- */
    UserPostCollection selectById(@Param("id") Long id);

    List<UserPostCollection> selectByUserId(@Param("userId") Long userId);

    UserPostCollection selectByUserIdAndFolderName(@Param("userId") Long userId, @Param("folderName") String folderName);

    /* ---------- 计数 ---------- */
    long countByUserId(@Param("userId") Long userId);

    boolean existsByUserIdAndFolderName(@Param("userId") Long userId, @Param("folderName") String folderName);
}
