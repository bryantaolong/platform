-- 测试审计字段填充
-- 先清空post表
TRUNCATE TABLE post RESTART IDENTITY CASCADE;

-- 插入测试数据（不要设置审计字段）
INSERT INTO post (user_id, title, content, status, category_id, tags, comment_area_status)
VALUES 
    (1, '测试审计1', '内容1', 3, 1, ARRAY['test1'], 1),
    (1, '测试审计2', '内容2', 3, 1, ARRAY['test2'], 1);

-- 查询结果
SELECT 
    id,
    title,
    created_at,
    created_by,
    updated_at,
    updated_by
FROM post 
ORDER BY id;

-- 如果created_at和updated_at为NULL，说明审计拦截器未生效
-- 如果created_by和updated_by为NULL，说明当前用户获取失败
