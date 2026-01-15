-- ============================================
-- 测试审计字段自动填充
-- ============================================

-- 清空测试数据
TRUNCATE TABLE post RESTART IDENTITY CASCADE;

-- 查看表结构（确认审计字段存在）
\d post

-- 插入测试数据（不需要手动设置审计字段）
INSERT INTO post (user_id, title, content, status, category_id, tags)
VALUES (
    1,
    '测试审计字段',
    '验证CreatedAt/CreatedBy/UpdatedAt/UpdatedBy是否自动填充',
    3,  -- AUDITING
    1,
    ARRAY['test']
);

-- 查询结果，检查审计字段
SELECT 
    id,
    title,
    created_at,
    created_by,
    updated_at,
    updated_by
FROM post 
WHERE id = 1;

-- 如果审计字段为NULL，说明拦截器未生效
-- 如果审计字段有值，说明拦截器生效了

-- 预期的正确结果：
-- created_at: 当前时间 (非NULL)
-- created_by: admin 或 system (非NULL)
-- updated_at: 当前时间 (非NULL)
-- updated_by: admin 或 system (非NULL)

