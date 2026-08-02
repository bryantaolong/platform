import request from '@/utils/request.ts'
import type { ApiResponse, PageResponse } from '@/types/response'
import type { Post, PostVO, PostSummaryVO, PostCreateRequest, PostUpdateRequest, PostSearchRequest, PostStatusEnum } from '@/types'

// Define Post API endpoints

// 创建博文（提交审核）
export function createPost(data: PostCreateRequest): Promise<ApiResponse<Post>> {
  return request({
    url: '/api/posts',
    method: 'POST',
    data
  })
}

// 保存博文草稿
export function savePostDraft(data: PostCreateRequest): Promise<ApiResponse<Post>> {
  return request({
    url: '/api/posts/draft',
    method: 'POST',
    data
  })
}

// 上传博文图片
export function uploadPostImage(formData: FormData): Promise<ApiResponse<{ url: string }>> {
  return request({
    url: '/api/posts/upload/image',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 管理员分页查询所有博文（含草稿/已删除）
export function listAllPosts(pageNum: number, pageSize: number): Promise<ApiResponse<PageResponse<PostVO>>> {
  return request({
    url: '/api/posts/all',
    method: 'GET',
    params: {
      pageNum,
      pageSize
    }
  })
}

// 全站已发布文章分页（任何用户可见）
export function listAllPublishedPosts(
  pageNum: number,
  pageSize: number
): Promise<ApiResponse<PageResponse<PostSummaryVO>>> {
  return request({
    url: '/api/posts/published',
    method: 'GET',
    params: { pageNum, pageSize }
  })
}

// 获取当前用户关注用户的已发布文章分页列表
export function listFollowedUsersPosts(
  pageNum: number,
  pageSize: number
): Promise<ApiResponse<PageResponse<PostSummaryVO>>> {
  return request({
    url: '/api/posts/following',
    method: 'GET',
    params: { pageNum, pageSize }
  })
}

// 查询指定用户的全部博文（含草稿、已删除）
export function listAllPostsByUserId(userId: number, pageNum: number, pageSize: number): Promise<ApiResponse<PageResponse<PostVO>>> {
  return request({
    url: `/api/posts/${userId}/all`,
    method: 'GET',
    params: {
      pageNum,
      pageSize
    }
  })
}

// 查询指定用户已发布的博文
export function listPublishedPostsByUserId(userId: number, pageNum: number, pageSize: number): Promise<ApiResponse<PageResponse<PostVO>>> {
  return request({
    url: `/api/posts/${userId}/published`,
    method: 'GET',
    params: {
      pageNum,
      pageSize
    }
  })
}

// 根据主键查询单条博文
export function getPostById(id: number): Promise<ApiResponse<PostVO>> {
  return request({
    url: `/api/posts/${id}`,
    method: 'GET'
  })
}

// 管理员多条件搜索博文 (按标题)
export function listPostsByTitle(
  title: string,
  pageNum: number,
  pageSize: number
): Promise<ApiResponse<PageResponse<PostVO>>> {
  return request({
    url: '/api/posts/title',
    method: 'POST',
    params: {
      title,
      pageNum,
      pageSize
    }
  })
}

// 管理员多条件搜索博文 (admin/query)
export function queryPosts(
  req: PostSearchRequest,
  pageNum: number,
  pageSize: number
): Promise<ApiResponse<PageResponse<PostVO>>> {
  return request({
    url: '/api/posts/admin/query',
    method: 'POST',
    data: req,
    params: {
      pageNum,
      pageSize
    }
  })
}

// 更新博文
export function updatePost(id: number, data: PostUpdateRequest): Promise<ApiResponse<Post>> {
  return request({
    url: `/api/posts/${id}`,
    method: 'PUT',
    data
  })
}

// 管理员修改博文状态
export function updatePostStatus(id: number, status: PostStatusEnum): Promise<ApiResponse<Post>> {
  return request({
    url: `/api/posts/status/${id}`,
    method: 'PUT',
    params: { status }
  })
}

// 删除博文（逻辑删除）
export function deletePost(id: number): Promise<ApiResponse<boolean>> {
  return request({
    url: `/api/posts/${id}`,
    method: 'DELETE'
  })
}

// 点赞博文
export function likePost(id: number): Promise<ApiResponse<boolean>> {
  return request({
    url: `/api/posts/${id}/like`,
    method: 'POST'
  })
}

// 取消点赞博文
export function unlikePost(id: number): Promise<ApiResponse<boolean>> {
  return request({
    url: `/api/posts/${id}/unlike`,
    method: 'POST'
  })
}

// 查询当前用户对某条博文的点赞状态
export function checkLikeStatus(postId: number): Promise<ApiResponse<boolean>> {
  return request({
    url: `/api/posts/${postId}/like/status`,
    method: 'GET'
  })
}
