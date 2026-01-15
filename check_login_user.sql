-- 检查登录用户的数据状态
SELECT '=== 用户数据检查 ===' as section;

-- 1. 查询所有用户（包含已删除的）
SELECT id, username, roles, status, deleted, created_at 
FROM sys_user 
ORDER BY id;

-- 2. 查询可登录的用户（status=0, deleted=0）
SELECT '可登录用户:' as info, id, username, roles 
FROM sys_user 
WHERE status = 0 AND deleted = 0;

-- 3. 检查ID为1的用户状态
SELECT 'ID=1用户详情:' as info, 
       id, username, roles, status, deleted, login_fail_count
FROM sys_user 
WHERE id = 1;

-- 4. 查询用户角色表
SELECT '=== 角色数据 ===' as section;
SELECT * FROM user_role ORDER BY id;

-- 5. 检查是否需要插入测试数据
SELECT '如果上述查询结果为空，需要插入测试数据' as reminder;

-- 插入测试数据SQL（如果需要）
-- INSERT INTO sys_user (id, username, password, email, roles, status, deleted)
-- VALUES (1, 'admin', '$2a$10$encrypted_password', 'admin@example.com', 'ROLE_ADMIN,ROLE_USER', 0, 0);
