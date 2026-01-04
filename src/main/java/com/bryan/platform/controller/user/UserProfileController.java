package com.bryan.platform.controller.user;

import com.bryan.platform.domain.converter.UserConverter;
import com.bryan.platform.domain.dto.user.UserProfileUpdateDTO;
import com.bryan.platform.domain.entity.user.SysUser;
import com.bryan.platform.domain.entity.user.UserProfile;
import com.bryan.platform.domain.request.user.UserUpdateRequest;
import com.bryan.platform.domain.response.Result;
import com.bryan.platform.domain.vo.user.UserProfileVO;
import com.bryan.platform.service.auth.AuthService;
import com.bryan.platform.service.user.UserProfileService;
import com.bryan.platform.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * UserProfileController
 *
 * @author Bryan Long
 */
@Validated
@RestController
@RequestMapping("/api/user-profiles")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final UserService userService;
    private final AuthService authService;

    @GetMapping("/{userId}")
    public Result<UserProfileVO> getUserProfileByUserId(@PathVariable Long userId) {
        UserProfile profile = userProfileService.getUserProfileByUserId(userId);
        SysUser user = userService.getUserById(userId);
        return Result.success(UserConverter.toUserProfileVO(user,  profile));
    }

    @GetMapping("/name/{realName}")
    public Result<UserProfileVO> getUserProfileByRealName(@PathVariable String realName) {
        UserProfile profile = userProfileService.findUserProfileByRealName(realName);
        SysUser user = userService.getUserById(profile.getUserId());
        return Result.success(UserConverter.toUserProfileVO(user,  profile));
    }

    @GetMapping("/me")
    public Result<UserProfileVO> getCurrentUserProfile() {
        Long UserId = authService.getCurrentUserId();
        return this.getUserProfileByUserId(UserId);
    }

    @PutMapping
    public Result<UserProfileVO> updateUserProfile(
            @RequestBody UserUpdateRequest req) {
        Long userId = authService.getCurrentUserId();
        UserProfileUpdateDTO dto = UserProfileUpdateDTO.builder()
                .realName(req.getRealName())
                .gender(req.getGender())
                .birthday(req.getBirthday())
                .avatar(req.getAvatar())
                .build();
        UserProfileVO vo = UserConverter.toUserProfileVO(authService.getCurrentUser(),
                                                            userProfileService.updateUserProfile(userId, dto));
        return Result.success(vo);
    }
}
