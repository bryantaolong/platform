package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.UserPostCollection;
import org.apache.ibatis.annotations.Mapper;

/**
 * UserPostCollectionMapper
 *
 * @author Bryan Long
 */
@Mapper
public interface UserPostCollectionMapper {

    int insert(UserPostCollection record);

}
