package com.bryan.platform.domain.enums.post;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * PostStatusEnum
 *
 * @author Bryan Long
 */
@Getter
@AllArgsConstructor
public enum PostStatusEnum {
    PUBLISHED(0,"已发布"),
    DRAFT(1,"草稿"),
    PRIVATE(2,"仅自己可见"),
    AUDITING(3,"审核中"),
    RECYCLED(4,"回收站");

    private final int code;
    private final String desc;

    public static PostStatusEnum of(int code) {
        for (PostStatusEnum e : values()) {
            if (e.code == code) return e;
        }
        throw new IllegalArgumentException("unknown post status " + code);
    }
}
