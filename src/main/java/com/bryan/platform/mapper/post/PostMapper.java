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

    int insert(Post record);

    Post selectById(@Param("id") Long id);

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

    List<Post> selectRecentPosts(@Param("limit") int limit, @Param("hours") int hours);

    List<Post> selectByTags(@Param("tags") List<String> tags, @Param("limit") int limit);

    List<Post> selectByUserIds(@Param("userIds") List<Long> userIds, @Param("limit") int limit);

    List<Post> selectHotPosts(@Param("limit") int limit);

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

    int update(Post record);

    int updateLikeCount(@Param("id") Long id, @Param("delta") int delta);

    int updateCollectCount(@Param("id") Long id, @Param("delta") int delta);

    int updateViewCount(@Param("id") Long id, @Param("delta") int delta);

    int updateCommentCount(@Param("id") Long id, @Param("delta") int delta);

    int deleteById(@Param("id") Long id);
}
