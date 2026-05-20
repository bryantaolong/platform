package com.bryan.platform.mapper.user;

import com.bryan.platform.domain.entity.user.UserMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UserMessage 用户私信消息数据访问层
 *
 * @author Bryan Long
 */
@Mapper
public interface UserMessageMapper {

    /* ---------- 增 ---------- */

    /**
     * 插入消息
     */
    int insert(UserMessage record);

    /* ---------- 查 ---------- */

    /**
     * 根据ID查询消息
     */
    UserMessage selectById(Long id);

    /**
     * 分页查询两个用户之间的消息（按时间正序）
     */
    List<UserMessage> selectPageBetweenUsers(@Param("userId1") Long userId1,
                                             @Param("userId2") Long userId2,
                                             @Param("offset") long offset,
                                             @Param("size") int size);

    /**
     * 统计两个用户之间的消息总数
     */
    long countBetweenUsers(@Param("userId1") Long userId1,
                           @Param("userId2") Long userId2);

    /**
     * 查询用户的会话列表（最近联系人）
     * 返回每个会话的最后一条消息
     */
    List<UserMessage> selectConversationList(@Param("userId") Long userId,
                                             @Param("offset") long offset,
                                             @Param("size") int size);

    /**
     * 统计用户的会话数量
     */
    long countConversations(@Param("userId") Long userId);

    /**
     * 查询用户未读消息数量
     */
    long countUnreadByReceiverId(@Param("receiverId") Long receiverId);

    /**
     * 查询用户与某联系人的未读消息数量
     */
    long countUnreadBetweenUsers(@Param("userId") Long userId,
                                 @Param("contactId") Long contactId);

    /* ---------- 改 ---------- */

    /**
     * 标记消息为已读
     */
    int updateReadStatus(@Param("id") Long id,
                         @Param("readStatus") Integer readStatus,
                         @Param("readAt") java.time.LocalDateTime readAt,
                         @Param("version") Integer version,
                         @Param("updatedAt") java.time.LocalDateTime updatedAt,
                         @Param("updatedBy") String updatedBy);

    /**
     * 撤回消息
     */
    int updateRecallStatus(@Param("id") Long id,
                           @Param("status") Integer status,
                           @Param("recalledAt") java.time.LocalDateTime recalledAt,
                           @Param("version") Integer version,
                           @Param("updatedAt") java.time.LocalDateTime updatedAt,
                           @Param("updatedBy") String updatedBy);

    /**
     * 标记与某用户的所有消息为已读
     */
    int updateReadStatusByContact(@Param("userId") Long userId,
                                  @Param("contactId") Long contactId,
                                  @Param("readAt") java.time.LocalDateTime readAt);
}
