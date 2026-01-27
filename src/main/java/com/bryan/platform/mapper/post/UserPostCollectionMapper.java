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

    int insert(UserPostCollection record);

    UserPostCollection selectById(@Param("id") Long id);

    List<UserPostCollection> selectByUserId(@Param("userId") Long userId);

    UserPostCollection selectByUserIdAndFolderName(@Param("userId") Long userId, @Param("folderName") String folderName);

    long countByUserId(@Param("userId") Long userId);

    boolean existsByUserIdAndFolderName(@Param("userId") Long userId, @Param("folderName") String folderName);

    int update(UserPostCollection record);

    int deleteById(@Param("id") Long id);
}
