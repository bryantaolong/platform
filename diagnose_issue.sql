-- 问题诊断SQL清单
-- 请逐个在PostgreSQL中执行这些SQL，确认问题所在

-- ============= 诊断1: 检查表是否存在 =============
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND (tablename = 'sys_user' OR tablename = 'Sys_user' OR tablename = 'SYS_USER')
ORDER BY tablename;

-- ============= 诊断2: 直接查询sys_user =============  
-- 尝试不使用引号查询
SELECT * FROM sys_user LIMIT 1;

-- ============= 诊断3: 使用引号查询 =============
-- 尝试使用引号查询（如果诊断2失败）
SELECT * FROM "sys_user" LIMIT 1;

-- ============= 诊断4: 检查用户表数据 =============
-- 如果以上查询成功，检查是否有数据
SELECT 'Total users:' as info, COUNT(*) as count FROM sys_user;
SELECT 'User ID=1:' as info, id, username, roles FROM sys_user WHERE id = 1;

-- ============= 诊断5: 检查外键约束状态 =============
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table_name,
    ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON tc.constraint_name = ccu.constraint_name
    AND tc.table_schema = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('post', 'user_profile');

-- ============= 诊断6: 检查序列是否存在 =============
SELECT sequence_name, last_value, start_value 
FROM user_id_seq;

-- ============= 诊断7: 检查POST请求失败的具体原因 =============
-- 当Postman返回错误时，在PostgreSQL日志中查看具体错误
-- 或启用Spring Boot的SQL日志，查看实际执行的SQL

-- 如果是外键约束失败，临时禁用外键检查（仅用于测试）：
-- ALTER TABLE post DROP CONSTRAINT IF EXISTS post_user_id_fkey;
-- ALTER TABLE user_profile DROP CONSTRAINT IF EXISTS user_profile_user_id_fkey;

-- 测试完后再重新添加：
-- ALTER TABLE post ADD CONSTRAINT post_user_id_fkey FOREIGN KEY (user_id) REFERENCES sys_user(id);
-- ALTER TABLE user_profile ADD CONSTRAINT user_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES sys_user(id);
