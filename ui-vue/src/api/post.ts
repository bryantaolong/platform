import request from '@/utils/request'
import type {Post} from '@/models/entity/post/Post'
import type {PostVO} from '@/models/vo/post/PostVO'
import type {PostCreateRequest} from "@/models/request/post/PostCreateRequest.ts";
import type {PostUpdateRequest} from "@/models/request/post/PostUpdateRequest.ts";
import type {PostStatusEnum} from "@/models/enum/PostStatusEnum.ts";
import type {Result} from "@/models/response/Result.ts";
import type {PageResult} from "@/models/response/PageResult.ts";

// Define Post API endpoints
export const postApi = {
    // Get all posts with pagination
    getAllPosts: (pageNum: number, pageSize: number): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: '/api/posts/all',
            method: 'get',
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
    ): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: '/api/posts/published',
            method: 'get',
            params: {pageNum, pageSize}
        })
    },

    // Search posts with pagination
    searchPosts: (
        title: string,
        author: string,
        tags: string,
        pageNum: number,
        pageSize: number
    ): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: '/api/posts/search',
            method: 'get',
            params: {
                title,
                author,
                tags,
                pageNum,
                pageSize
            }
        })
    },

    // Get posts by user ID with pagination
    getPostsByUserId: (userId: number, pageNum: number, pageSize: number): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: `/api/posts/${userId}/all`,
            method: 'get',
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
            method: 'get',
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
            method: 'get'
        })
    },

    // Get a post audit VO by ID
    getPostAuditById: (id: number): Promise<Result<PostVO>> => {
        return request({
            url: `/api/posts/audit/${id}`,
            method: 'get'
        })
    },

    // Create a new post
    createPost: (data: PostCreateRequest): Promise<Result<Post>> => {
        return request({
            url: '/api/posts',
            method: 'post',
            data
        })
    },

    // Save a draft post
    saveDraft: (data: PostCreateRequest): Promise<Result<Post>> => {
        return request({
            url: '/api/posts/draft',
            method: 'post',
            data
        })
    },

    // Update an existing post
    updatePost: (id: number, data: PostUpdateRequest): Promise<Result<Post>> => {
        return request({
            url: `/api/posts/${id}`,
            method: 'put',
            data
        })
    },

    // Update post's status
    updatePostStatus: (id: number, status: PostStatusEnum): Promise<Result<Post>> => {
        return request({
            url: `/api/posts/status/${id}`,
            method: 'put',
            params: {status}
        })
    },

    // Delete a post
    deletePost: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/posts/${id}`,
            method: 'delete'
        })
    },

    // Like a post
    likePost: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/posts/${id}/like`,
            method: 'post'
        })
    },

    // Unlike a post
    unlikePost: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/posts/${id}/unlike`,
            method: 'post'
        })
    },

    // Collect a post
    collectPost: (postId: number, collectionId?: number): Promise<Result<any>> => {
        return request({
            url: '/api/user/post-collects',
            method: 'post',
            data: {
                postId,
                collectionId: collectionId || 0
            }
        })
    },

    // Uncollect a post
    uncollectPost: (postId: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/user/post-collects/${postId}`,
            method: 'delete'
        })
    },

    // Check if post is collected
    checkCollectStatus: (postId: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/user/post-collects/${postId}/status`,
            method: 'get'
        })
    },

    // Get user collects
    getUserCollects: (pageNum: number, pageSize: number): Promise<Result<PageResult<any>>> => {
        return request({
            url: '/api/user/post-collects',
            method: 'get',
            params: {
                pageNum,
                pageSize
            }
        })
    }
}