package com.bryan.platform.domain.request.post;

import lombok.Getter;

/**
 * UserPostCollectRequest
 *
 * @author Bryan Long
 */
@Getter
public class UserPostCollectRequest {

    private Long postId;

    private Long collectionId; // 可选，默认0
}