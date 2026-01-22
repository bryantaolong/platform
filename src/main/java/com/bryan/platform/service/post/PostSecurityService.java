package com.bryan.platform.service.post;

import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.mapper.post.PostMapper;
import com.bryan.platform.util.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Post安全服务，用于权限验证
 *
 * @author Bryan
 */
@Service
@RequiredArgsConstructor
public class PostSecurityService {

    private final PostMapper postMapper;
    private final JwtUtils jwtUtils;

    /**
     * 检查当前用户是否为文章的所有者
     *
     * @param postId 文章ID
     * @return true如果是所有者，false否则
     */
    public boolean isOwner(Long postId) {
        try {
            Long currentUserId = jwtUtils.getCurrentUserId();
            Post post = postMapper.selectById(postId);
            return post != null && post.getUserId().equals(currentUserId);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 检查指定用户是否为文章的所有者
     *
     * @param postId 文章ID
     * @param userId 用户ID
     * @return true如果是所有者，false否则
     */
    public boolean isOwner(Long postId, Long userId) {
        try {
            Post post = postMapper.selectById(postId);
            return post != null && post.getUserId().equals(userId);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 获取文章并验证所有权
     *
     * @param postId 文章ID
     * @return 文章对象
     * @throws RuntimeException 如果文章不存在或无权限访问
     */
    public Post getPostWithOwnershipCheck(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new RuntimeException("文章不存在");
        }

        try {
            Long currentUserId = jwtUtils.getCurrentUserId();
            if (!post.getUserId().equals(currentUserId)) {
                throw new RuntimeException("无权限访问此文章");
            }
        } catch (Exception e) {
            throw new RuntimeException("权限验证失败");
        }

        return post;
    }
}