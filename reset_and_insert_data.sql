-- ============================================
-- 清空所有数据并插入管理员用户
-- 密码: 123456 (BCrypt加密)
-- 角色: ROLE_ADMIN,ROLE_USER (无空格，推荐格式)
-- ============================================

-- 禁用外键约束检查（用于清空数据）
ALTER TABLE post DISABLE TRIGGER ALL;
ALTER TABLE user_profile DISABLE TRIGGER ALL;
ALTER TABLE user_follow DISABLE TRIGGER ALL;
ALTER TABLE user_post_collect DISABLE TRIGGER ALL;
ALTER TABLE user_post_collection DISABLE TRIGGER ALL;
ALTER TABLE user_post_like DISABLE TRIGGER ALL;
ALTER TABLE post_comment DISABLE TRIGGER ALL;

-- 清空所有用户相关数据表
TRUNCATE TABLE sys_user RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_role RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_profile RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_follow RESTART IDENTITY CASCADE;

-- 清空所有博文相关数据表  
TRUNCATE TABLE post RESTART IDENTITY CASCADE;
TRUNCATE TABLE post_comment RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_post_collect RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_post_collection RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_post_like RESTART IDENTITY CASCADE;

-- 重置序列
ALTER SEQUENCE user_id_seq RESTART WITH 1;

-- 重新启用外键约束检查
ALTER TABLE post ENABLE TRIGGER ALL;
ALTER TABLE user_profile ENABLE TRIGGER ALL;
ALTER TABLE user_follow ENABLE TRIGGER ALL;
ALTER TABLE user_post_collect ENABLE TRIGGER ALL;
ALTER TABLE user_post_collection ENABLE TRIGGER ALL;
ALTER TABLE user_post_like ENABLE TRIGGER ALL;
ALTER TABLE post_comment ENABLE TRIGGER ALL;

-- ============================================
-- 插入基础数据
-- ============================================

-- 插入默认角色
INSERT INTO user_role (id, role_name, is_default, deleted, version, created_at, updated_at)
VALUES 
    (1, 'ROLE_ADMIN', false, 0, 0, NOW(), NOW()),
    (2, 'ROLE_USER', true, 0, 0, NOW(), NOW());

-- 插入管理员用户（密码: 123456）
INSERT INTO sys_user (
    id, username, password, email, roles, status, deleted, version, 
    login_fail_count, created_at, updated_at
)
VALUES (
    1,
    'admin',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lqp.8j9Hnkoj6Wq',  -- 密码: 123456 (BCrypt加密)
    'admin@platform.com',
    'ROLE_ADMIN,ROLE_USER',  -- 无空格格式，推荐
    0,  -- status: 正常
    0,  -- deleted: 未删除
    0,  -- version: 乐观锁
    0,  -- login_fail_count: 登录失败次数
    NOW(),
    NOW()
);

-- 插入管理员的用户资料
INSERT INTO user_profile (
    user_id, real_name, gender, birthday, avatar, deleted, version, created_at, updated_at
)
VALUES (
    1,
    '系统管理员',
    1,  -- gender: 1=男 0=女
    '1990-01-01 00:00:00',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    0,  -- deleted: 未删除
    0,  -- version: 乐观锁
    NOW(),
    NOW()
);

-- ============================================
-- 验证插入结果
-- ============================================

SELECT '=== 管理员用户信息 ===' as info;
SELECT 
    id, 
    username, 
    email, 
    roles,
    status, 
    deleted,
    CASE 
        WHEN password = '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lqp.8j9Hnkoj6Wq' 
        THEN '密码正确(123456)' 
        ELSE '密码不匹配' 
    END as password_check
FROM sys_user 
WHERE username = 'admin';

SELECT '=== 角色列表 ===' as info;
SELECT id, role_name, is_default FROM user_role ORDER BY id;

SELECT '=== 管理员资料 ===' as info;
SELECT user_id, real_name, gender, avatar FROM user_profile WHERE user_id = 1;

SELECT '数据初始化完成！' as status;
SELECT '用户名: admin' as login_info;
SELECT '密码: 123456' as login_info;
SELECT '角色: ROLE_ADMIN,ROLE_USER' as login_info;
SELECT 'JWT中的sub字段应为: 1' as token_info;

