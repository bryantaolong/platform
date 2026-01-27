package com.bryan.platform.mapper.user;

import com.bryan.platform.domain.entity.user.UserFollow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UserFollow 用户关注数据访问层
 *
 * @author Bryan Long
 */
@Mapper
public interface UserFollowMapper {

    /* ---------- 增 ---------- */
    int insert(UserFollow record);

    /* ---------- 查 ---------- */
    UserFollow selectById(Long id);

    List<UserFollow> selectPageByFollowerId(@Param("followerId") Long followerId,
                                            @Param("offset") long offset,
                                            @Param("size") int size);

    List<UserFollow> selectPageByFollowingId(@Param("followingId") Long followingId,
                                             @Param("offset") long offset,
                                             @Param("size") int size);

    List<UserFollow> selectAllByFollowerId(@Param("followerId") Long followerId);

    long countByFollowerId(@Param("followerId") Long followerId);

    long countByFollowingId(@Param("followingId") Long followingId);

    long countByFollowerIdAndFollowingId(@Param("followerId") Long followerId,
                                         @Param("followingId") Long followingId);

    /* ---------- 改 ---------- */
    int updateDeletedByFollowerIdAndFollowingId(@Param("followerId") Long followerId,
                                                @Param("followingId") Long followingId,
                                                @Param("deleted") Integer deleted);
}
