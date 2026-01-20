// src/api/chat.ts
import request from '@/utils/request';
import type { Result } from '@/models/response/Result';

/**
 * AI 聊天相关 API 请求模块
 */

/**
 * 与 AI 对话接口
 * @param message 用户消息
 * @returns AI 回复内容
 */
export function sendChatMessage(message: string): Promise<{ reply: string }> {
    return request({
        url: '/api/llm/chat',
        method: 'post',
        data: { message },
    });
}

/**
 * 清空当前用户的聊天上下文
 */
export function clearChatContext(): Promise<Result<string>> {
    return request({
        url: '/api/llm/chat/clear',
        method: 'post',
    });
}
