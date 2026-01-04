package com.bryan.platform.domain.request.post;

import lombok.Getter;

import java.util.List;

/**
 * PostUpdateRequest
 *
 * @author Bryan Long
 */
@Getter
public class PostUpdateRequest {

    private Long    id;

    private String  title;

    private String  content;

    private Long categoryId;

    private String tags;

    private String commentAreaStatus;

    private Integer weight;
}
