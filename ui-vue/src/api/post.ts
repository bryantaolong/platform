import request from '@/utils/request'
import type {Post} from '@/models/entity/post/Post'
import type {PostSummaryVO} from '@/models/vo/post/PostSummaryVO'
import type {PostVO} from '@/models/vo/post/PostVO'
import type {PostCreateRequest} from "@/models/request/post/PostCreateRequest.ts";
import type {PostUpdateRequest} from "@/models/request/post/PostUpdateRequest.ts";
import type {PostSearchRequest} from "@/models/request/post/PostSearchRequest.ts";
import type {PostStatusEnum} from "@/models/enum/PostStatusEnum.ts";
import type {Result} from "@/models/response/Result.ts";
import type {PageResult} from "@/models/response/PageResult.ts";

// Define Post API endpoints
export const postApi = {
    // Get all posts with pagination
    getAllPosts: (pageNum: number, pageSize: number): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: '/api/posts/all',
            method: 'GET',
            params: {
                pageNum,
                pageSize
            }
        })
    },

    // 全站已发布文章分页（新增）
    getAllPublishedPosts: (
        pageNum: number,
        pageSize: number
    ): Promise<Result<PageResult<PostSummaryVO>>> => {
        return request({
            url: '/api/posts/published',
            method: 'GET',
            params: {pageNum, pageSize}
        })
    },

    // Search posts with pagination
    searchPostsByTitle: (
        title: string,
        pageNum: number,
        pageSize: number
    ): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: '/api/posts/title',
            method: 'POST',
            params: {
                title,
                pageNum,
                pageSize
            }
        })
    },

    // Admin search posts with pagination
    searchPostsAdmin: (
        req: PostSearchRequest,
        pageNum: number,
        pageSize: number
    ): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: '/api/posts/admin/search',
            method: 'POST',
            data: req,
            params: {
                pageNum,
                pageSize
            }
        })
    },

    // Admin search posts with corrected backend path (用于后台运营配置)
    searchPostsAdminFixed: (
        req: PostSearchRequest,
        pageNum: number,
        pageSize: number
    ): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: '/api/posts/admin/search',
            method: 'POST',
            data: req,
            params: {
                pageNum,
                pageSize
            }
        })
    },

    // Get posts by user ID with pagination
    getPostsByUserId: (userId: number, pageNum: number, pageSize: number): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: `/api/posts/${userId}/all`,
            method: 'GET',
            params: {
                pageNum,
                pageSize
            }
        })
    },

    // Get post audit VOs by user ID with pagination
    getPostVOsByUserId: (userId: number, pageNum: number, pageSize: number): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: `/api/posts/${userId}/audit/all`,
            method: 'GET',
            params: {
                pageNum,
                pageSize
            }
        })
    },

    // Get published posts by user ID with pagination
    getPublishedPostsByUserId: (userId: number, pageNum: number, pageSize: number): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: `/api/posts/${userId}/published`,
            method: 'GET',
            params: {
                pageNum,
                pageSize
            }
        })
    },

    // Get a single post by ID
    getPostById: (id: number): Promise<Result<PostVO>> => {
        return request({
            url: `/api/posts/${id}`,
            method: 'GET'
        })
    },

    // Get a post VO by ID
    getPostAuditById: (id: number): Promise<Result<PostVO>> => {
        return request({
            url: `/api/posts/audit/${id}`,
            method: 'GET'
        })
    },

    // Create a new post
    createPost: (data: PostCreateRequest): Promise<Result<Post>> => {
        return request({
            url: '/api/posts',
            method: 'POST',
            data
        })
    },

    // Save a draft post
    saveDraft: (data: PostCreateRequest): Promise<Result<Post>> => {
        return request({
            url: '/api/posts/draft',
            method: 'POST',
            data
        })
    },

    // Update an existing post
    updatePost: (id: number, data: PostUpdateRequest): Promise<Result<Post>> => {
        return request({
            url: `/api/posts/${id}`,
            method: 'PUT',
            data
        })
    },

    // Update post's status
    updatePostStatus: (id: number, status: PostStatusEnum): Promise<Result<Post>> => {
        return request({
            url: `/api/posts/status/${id}`,
            method: 'PUT',
            params: {status}
        })
    },

    // Update post weight for manual ranking (admin only)
    updatePostWeight: (id: number, weight: number): Promise<Result<Post>> => {
        return request({
            url: `/api/admin/post-algorithm/posts/${id}/weight`,
            method: 'PUT',
            params: {weight}
        })
    },

    // Unpin post (admin only) - cancel manual pinning
    unpinPost: (id: number): Promise<Result<Post>> => {
        return request({
            url: `/api/admin/post-algorithm/posts/${id}/unpin`,
            method: 'PUT'
        })
    },

    // Delete a post
    deletePost: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/posts/${id}`,
            method: 'DELETE'
        })
    },

    // Like a post
    likePost: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/posts/${id}/like`,
            method: 'POST'
        })
    },

    // Unlike a post
    unlikePost: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/posts/${id}/unlike`,
            method: 'POST'
        })
    },

    // Check if post is liked by current user
    checkLikeStatus: (postId: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/posts/${postId}/like/status`,
            method: 'GET'
        })
    },

    // Get followed users' posts with pagination
    getFollowedUsersPosts: (
        pageNum: number,
        pageSize: number
    ): Promise<Result<PageResult<PostSummaryVO>>> => {
        return request({
            url: '/api/posts/following',
            method: 'GET',
            params: {pageNum, pageSize}
        })
    },

    // Upload post image
    uploadPostImage: (formData: FormData): Promise<Result<{ url: string }>> => {
        return request({
            url: '/api/posts/upload/image',
            method: 'POST',
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    // Get hot posts ranking
    getHotPosts: (limit: number = 10): Promise<Result<PostVO[]>> => {
        return request({
            url: '/api/posts/hot',
            method: 'GET',
            params: { limit }
        })
    },
}