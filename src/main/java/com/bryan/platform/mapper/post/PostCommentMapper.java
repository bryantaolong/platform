package com.bryan.platform.mapper.post;

import com.bryan.platform.domain.entity.post.PostComment;
import org.apache.ibatis.annotations.Mapper;

/**
 * PostCommentMapper
 *
 * @author Bryan Long
 */
@Mapper
public interface PostCommentMapper {

    int insert(PostComment record);


}
