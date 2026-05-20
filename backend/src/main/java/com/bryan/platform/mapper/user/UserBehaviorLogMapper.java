package com.bryan.platform.mapper.user;

import com.bryan.platform.domain.entity.user.UserBehaviorLog;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface UserBehaviorLogMapper {

    int insert(UserBehaviorLog record);

    UserBehaviorLog selectById(@Param("id") Long id);

    List<UserBehaviorLog> selectByUserId(@Param("userId") Long userId);

    List<UserBehaviorLog> selectByUserIdAndType(@Param("userId") Long userId, @Param("behaviorType") String behaviorType);

    List<Long> selectPostIdsByUserIdAndType(@Param("userId") Long userId, @Param("behaviorType") String behaviorType);

    int deleteById(@Param("id") Long id);
}
