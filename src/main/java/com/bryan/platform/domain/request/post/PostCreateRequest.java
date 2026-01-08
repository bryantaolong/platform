package com.bryan.platform.domain.request.post;

import lombok.Getter;

import java.util.List;

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

    private List<String> tags;
}