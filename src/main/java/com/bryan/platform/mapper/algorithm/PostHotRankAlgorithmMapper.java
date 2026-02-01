package com.bryan.platform.mapper.algorithm;

import com.bryan.platform.domain.entity.algorithm.PostHotRankAlgorithm;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * PostHotRankAlgorithmMapper
 * 帖子热度算法权重配置数据访问接口
 *
 * @author Bryan Long
 */
@Mapper
public interface PostHotRankAlgorithmMapper {

    /**
     * 插入权重配置
     *
     * @param record 权重配置
     * @return 影响行数
     */
    int insert(PostHotRankAlgorithm record);

    /**
     * 根据主键查询权重配置
     *
     * @param id 主键
     * @return 权重配置
     */
    PostHotRankAlgorithm selectById(@Param("id") Long id);

    /**
     * 查询所有权重配置
     *
     * @return 权重配置列表
     */
    List<PostHotRankAlgorithm> selectAll();

    /**
     * 更新权重配置
     *
     * @param record 权重配置
     * @return 影响行数
     */
    int update(PostHotRankAlgorithm record);

    /**
     * 根据主键删除权重配置（逻辑删除）
     *
     * @param id 主键
     * @return 影响行数
     */
    int deleteById(@Param("id") Long id);
}
