package com.bryan.platform.domain.enums.post;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * CommentStatusEnum
 *
 * @author Bryan Long
 */
@Getter
@AllArgsConstructor
public enum CommentStatusEnum {
    NORMAL(0, "正常"),
    AUDITING(1, "待审"),
    HIDDEN(2, "已隐藏"),
    DELETED(3, "已删除");

    private final int code;
    private final String desc;

    public static CommentStatusEnum of(int code) {
        for (CommentStatusEnum e : values()) {
            if (e.code == code) return e;
        }
        throw new IllegalArgumentException("unknown comment status " + code);
    }
}
