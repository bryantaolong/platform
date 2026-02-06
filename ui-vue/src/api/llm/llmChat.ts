// src/api/llmChat.ts
import request from '@/utils/request.ts'
import type { Result } from '@/models/response/Result.ts'

/**
 * AI 聊天相关 API
 */

/**
 * 与 AI 对话接口
 * @param message 用户消息
 * @param provider 模型提供商（deepseek、moonshot、minimax），可选，默认使用服务端配置
 * @returns AI 回复内容
 */
export function sendChatMessage(message: string, provider?: string): Promise<{ reply: string }> {
  return request.post('/api/llm/chat', { message, provider })
}

/**
 * 清空当前用户的聊天上下文
 */
export function clearChatContext(): Promise<Result<string>> {
  return request.post('/api/llm/chat/clear')
}

/**
 * 生成文章 AI 摘要
 * @param title 文章标题
 * @param content 文章内容
 * @returns AI 生成的摘要内容
 */
export function generatePostSummary(title: string, content: string): Promise<{ summary: string }> {
  return request.post('/api/llm/chat/post/summary', { title, content })
}
