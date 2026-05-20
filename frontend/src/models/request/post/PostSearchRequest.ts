// src/models/request/post/PostSearchRequest.ts
import type {PostStatusEnum} from '@/models/enum';

export interface PostSearchRequest {
    title?: string
    author?: string
    tags?: string
    status?: PostStatusEnum
}