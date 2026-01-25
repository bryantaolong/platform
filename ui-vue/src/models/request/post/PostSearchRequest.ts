// src/models/request/post/PostSearchRequest.ts
import type {PostStatusEnum} from "@/models/enum/PostStatusEnum.ts";

export interface PostSearchRequest {
    title?: string
    author?: string
    tags?: string
    status?: PostStatusEnum
}