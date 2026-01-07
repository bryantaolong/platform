import request from '@/utils/request'
import type { Post } from '@/models/entity/post/Post'
import type { PostVO } from '@/models/vo/post/PostVO'
import type {PostCreateRequest} from "@/models/request/post/PostCreateRequest.ts";
import type {PostUpdateRequest} from "@/models/request/post/PostUpdateRequest.ts";

// Define response types
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface PageResult<T> {
  rows: T[]
  total: number
  pageNum: number
  pageSize: number
}

// Define Post API endpoints
export const postApi = {
  // Get all posts with pagination
  getAllPosts: (pageNum: number, pageSize: number): Promise<ApiResponse<PageResult<PostVO>>> => {
    return request({
      url: '/api/posts/all',
      method: 'get',
      params: {
        pageNum,
        pageSize
      }
    })
  },

  // Search posts with pagination
  searchPosts: (
    title: string,
    author: string,
    tags: string,
    pageNum: number,
    pageSize: number
  ): Promise<ApiResponse<PageResult<PostVO>>> => {
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
  getPostsByUserId: (userId: number, pageNum: number, pageSize: number): Promise<ApiResponse<PageResult<PostVO>>> => {
    return request({
      url: `/api/posts/${userId}/all`,
      method: 'get',
      params: {
        pageNum,
        pageSize
      }
    })
  },

  // Get a single post by ID
  getPostById: (id: number): Promise<ApiResponse<PostVO>> => {
    return request({
      url: `/api/posts/${id}`,
      method: 'get'
    })
  },

  // Create a new post
  createPost: (data: PostCreateRequest): Promise<ApiResponse<Post>> => {
    return request({
      url: '/api/posts',
      method: 'post',
      data
    })
  },

  // Update an existing post
  updatePost: (id: number, data: PostUpdateRequest): Promise<ApiResponse<Post>> => {
    return request({
      url: `/api/posts/${id}`,
      method: 'put',
      data
    })
  },

  // Delete a post
  deletePost: (id: number): Promise<ApiResponse<boolean>> => {
    return request({
      url: `/api/posts/${id}`,
      method: 'delete'
    })
  },

  // Like a post
  likePost: (id: number): Promise<ApiResponse<boolean>> => {
    return request({
      url: `/api/posts/${id}/like`,
      method: 'post'
    })
  },

  // Unlike a post
  unlikePost: (id: number): Promise<ApiResponse<boolean>> => {
    return request({
      url: `/api/posts/${id}/unlike`,
      method: 'post'
    })
  },

  // Collect a post
  collectPost: (id: number): Promise<ApiResponse<boolean>> => {
    return request({
      url: `/api/posts/${id}/collect`,
      method: 'post'
    })
  },

  // Uncollect a post
  uncollectPost: (id: number): Promise<ApiResponse<boolean>> => {
    return request({
      url: `/api/posts/${id}/uncollect`,
      method: 'post'
    })
  }
}