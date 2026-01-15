-- 检查数据库中的实际数据

-- 1. 检查sys_user表是否存在以及数据
SELECT 'sys_user table exists' as check_point, COUNT(*) as record_count FROM sys_user;

-- 2. 检查user_profile表
SELECT 'user_profile table exists' as check_point, COUNT(*) as record_count FROM user_profile;

-- 3. 检查post表
SELECT 'post table exists' as check_point, COUNT(*) as record_count FROM post;

-- 4. 检查ID为1的用户是否存在（对应JWT中的sub=1）
SELECT 'User with ID=1' as check_point, id, username, roles FROM sys_user WHERE id = 1;

-- 5. 显示sys_user表的前5条记录
SELECT 'First 5 users' as check_point, id, username, roles FROM sys_user LIMIT 5;

-- 6. 检查序列状态
SELECT 'Sequence user_id_seq' as check_point, last_value FROM user_id_seq;
