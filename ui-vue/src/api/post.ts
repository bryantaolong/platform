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
    // 创建博文（提交审核）
    createPost: (data: PostCreateRequest): Promise<Result<Post>> => {
        return request({
            url: '/api/posts',
            method: 'POST',
            data
        })
    },

    // 保存博文草稿
    savePostDraft: (data: PostCreateRequest): Promise<Result<Post>> => {
        return request({
            url: '/api/posts/draft',
            method: 'POST',
            data
        })
    },

    // 上传博文图片
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

    // 管理员分页查询所有博文（含草稿/已删除）
    listAllPosts: (pageNum: number, pageSize: number): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: '/api/posts/all',
            method: 'GET',
            params: {
                pageNum,
                pageSize
            }
        })
    },

    // 全站已发布文章分页（任何用户可见）
    listAllPublishedPosts: (
        pageNum: number,
        pageSize: number
    ): Promise<Result<PageResult<PostSummaryVO>>> => {
        return request({
            url: '/api/posts/published',
            method: 'GET',
            params: {pageNum, pageSize}
        })
    },

    // 获取当前用户关注用户的已发布文章分页列表
    listFollowedUsersPosts: (
        pageNum: number,
        pageSize: number
    ): Promise<Result<PageResult<PostSummaryVO>>> => {
        return request({
            url: '/api/posts/following',
            method: 'GET',
            params: {pageNum, pageSize}
        })
    },

    // 查询指定用户的全部博文（含草稿、已删除）
    listAllPostsByUserId: (userId: number, pageNum: number, pageSize: number): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: `/api/posts/${userId}/all`,
            method: 'GET',
            params: {
                pageNum,
                pageSize
            }
        })
    },

    // 查询指定用户已发布的博文
    listPublishedPostsByUserId: (userId: number, pageNum: number, pageSize: number): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: `/api/posts/${userId}/published`,
            method: 'GET',
            params: {
                pageNum,
                pageSize
            }
        })
    },

    // 根据主键查询单条博文
    getPostById: (id: number): Promise<Result<PostVO>> => {
        return request({
            url: `/api/posts/${id}`,
            method: 'GET'
        })
    },

    // 管理员多条件搜索博文 (按标题)
    listPostsByTitle: (
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

    // 管理员多条件搜索博文 (admin/query)
    queryPosts: (
        req: PostSearchRequest,
        pageNum: number,
        pageSize: number
    ): Promise<Result<PageResult<PostVO>>> => {
        return request({
            url: '/api/posts/admin/query',
            method: 'POST',
            data: req,
            params: {
                pageNum,
                pageSize
            }
        })
    },

    // 更新博文
    updatePost: (id: number, data: PostUpdateRequest): Promise<Result<Post>> => {
        return request({
            url: `/api/posts/${id}`,
            method: 'PUT',
            data
        })
    },

    // 管理员修改博文状态
    updatePostStatus: (id: number, status: PostStatusEnum): Promise<Result<Post>> => {
        return request({
            url: `/api/posts/status/${id}`,
            method: 'PUT',
            params: {status}
        })
    },

    // 删除博文（逻辑删除）
    deletePost: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/posts/${id}`,
            method: 'DELETE'
        })
    },

    // 点赞博文
    likePost: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/posts/${id}/like`,
            method: 'POST'
        })
    },

    // 取消点赞博文
    unlikePost: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/posts/${id}/unlike`,
            method: 'POST'
        })
    },

    // 查询当前用户对某条博文的点赞状态
    checkLikeStatus: (postId: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/posts/${postId}/like/status`,
            method: 'GET'
        })
    },
}