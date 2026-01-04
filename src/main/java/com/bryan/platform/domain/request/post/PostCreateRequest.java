package com.bryan.platform.domain.request.post;

import lombok.Getter;

/**
 * PostCreateRequest
 *
 * @author Bryan Long
 */
@Getter
public class PostCreateRequest {

    private String title;

    private String content;

    private Long categoryId;

    private String tags;
}