package com.bryan.platform.domain.dto.user;

import lombok.Builder;
import lombok.Data;

/**
 * UserUpdateDTO
 *
 * @author Bryan Long
 */
@Data
@Builder
public class UserUpdateDTO {

    private String phone;

    private String email;
}
