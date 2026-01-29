package com.bryan.platform.service.algorithm;

import com.bryan.platform.config.properties.PostHotRankAlgorithmProperties;
import com.bryan.platform.domain.entity.post.Post;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * PostHotRankService
 *
 * @author Bryan Long
 */
@Service
@RequiredArgsConstructor
public class PostHotRankService {

    private final PostHotRankAlgorithmProperties weights;

    public double calculateHotScore(Post post) {
        // 1. 基础互动分（对数压缩）
        double interactionScore = Math.log(
                1 + post.getViewCount() * weights.get("view")
                        + post.getLikeCount() * weights.get("like")
                        + post.getCommentCount() * weights.get("comment")
                        + post.getCollectCount() * weights.get("collect")
                        + post.getShareCount() * weights.get("share")
        );

        // 2. 时间衰减
        long hours = Duration.between(post.getCreatedAt(), LocalDateTime.now()).toHours();
        double lambda = weights.get("decay_lambda");
        double timeDecay = Math.exp(-lambda * hours);

        // 3. 人工干预
        double manualScore = post.getWeight() * weights.get("manual");

        // 4. 总分
        return (interactionScore * timeDecay * 100) + manualScore;
    }
}
