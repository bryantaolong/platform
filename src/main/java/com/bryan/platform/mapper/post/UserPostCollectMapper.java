package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.UserPostCollect;
import org.apache.ibatis.annotations.Mapper;

/**
 * UserPostCollectMapper
 *
 * @author Bryan Long
 */
@Mapper
public interface UserPostCollectMapper {

    int insert(UserPostCollect record);

}
