package com.bryan.platform.mapper.user;

import com.bryan.platform.domain.entity.user.UserProfileInterest;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface UserProfileInterestMapper {

    int insert(UserProfileInterest record);

    UserProfileInterest selectById(@Param("id") Long id);

    List<UserProfileInterest> selectByUserId(@Param("userId") Long userId);

    List<String> selectTopInterestsByUserId(@Param("userId") Long userId, @Param("limit") int limit);

    UserProfileInterest selectByUserIdAndTag(@Param("userId") Long userId, @Param("interestTag") String interestTag);

    int updateWeight(@Param("userId") Long userId, @Param("interestTag") String interestTag, @Param("weight") Double weight);

    int deleteById(@Param("id") Long id);

    int deleteByUserId(@Param("userId") Long userId);
}
