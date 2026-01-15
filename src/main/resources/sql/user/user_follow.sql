CREATE TABLE user_follow (
                             id BIGSERIAL PRIMARY KEY,
                             follower_id BIGINT NOT NULL,
                             following_id BIGINT NOT NULL,
                             deleted INTEGER DEFAULT 0 NOT NULL,
                             version INTEGER DEFAULT 0 NOT NULL,
                             created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             created_by VARCHAR(255),
                             updated_by VARCHAR(255),
                             CONSTRAINT uk_follower_following UNIQUE (follower_id, following_id)
);

COMMENT ON TABLE user_follow IS '用户关注关系表';
COMMENT ON COLUMN user_follow.id IS '主键ID';
COMMENT ON COLUMN user_follow.follower_id IS '关注者ID';
COMMENT ON COLUMN user_follow.following_id IS '被关注者ID';
COMMENT ON COLUMN user_follow.created_at IS '关注时间';

-- 添加外键约束
ALTER TABLE user_follow
    ADD CONSTRAINT fk_user_follow_follower
        FOREIGN KEY (follower_id) REFERENCES "sys_user" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE user_follow
    ADD CONSTRAINT fk_user_follows_following
        FOREIGN KEY (following_id) REFERENCES "sys_user" (id) ON UPDATE CASCADE ON DELETE CASCADE;

-- 创建索引
CREATE INDEX idx_follower_id ON user_follow (follower_id);
CREATE INDEX idx_following_id ON user_follow (following_id);