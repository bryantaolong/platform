-- user_behavior_log
CREATE TABLE "user_behavior_log"
(
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT       NOT NULL,
    post_id          BIGINT       NOT NULL,
    behavior_type    VARCHAR(20)  NOT NULL,                               -- view/like/collect/comment/share
    duration_seconds INTEGER,                                             -- 停留时长（秒）
    deleted          INTEGER      DEFAULT 0                              NOT NULL,
    version          INTEGER      DEFAULT 0                              NOT NULL,
    created_at       TIMESTAMP    DEFAULT NOW()                         NOT NULL,
    updated_at       TIMESTAMP    DEFAULT NOW()                         NOT NULL,
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255)
);

COMMENT ON TABLE "user_behavior_log" IS '用户行为日志表，用于离线分析和推荐优化';
COMMENT ON COLUMN "user_behavior_log".id IS '主键ID';
COMMENT ON COLUMN "user_behavior_log".user_id IS '用户ID';
COMMENT ON COLUMN "user_behavior_log".post_id IS '帖子ID';
COMMENT ON COLUMN "user_behavior_log".behavior_type IS '行为类型：view(浏览)/like(点赞)/collect(收藏)/comment(评论)/share(分享)';
COMMENT ON COLUMN "user_behavior_log".duration_seconds IS '停留时长（秒）';
COMMENT ON COLUMN "user_behavior_log".deleted IS '软删除标记(0-未删除 1-已删除)';
COMMENT ON COLUMN "user_behavior_log".version IS '乐观锁版本号';
COMMENT ON COLUMN "user_behavior_log".created_at IS '记录创建时间';
COMMENT ON COLUMN "user_behavior_log".updated_at IS '记录更新时间';
COMMENT ON COLUMN "user_behavior_log".created_by IS '记录创建人';
COMMENT ON COLUMN "user_behavior_log".updated_by IS '记录更新人';

CREATE INDEX idx_behavior_log_user_id ON "user_behavior_log" (user_id);
CREATE INDEX idx_behavior_log_post_id ON "user_behavior_log" (post_id);
CREATE INDEX idx_behavior_log_type ON "user_behavior_log" (behavior_type);
CREATE INDEX idx_behavior_log_created_at ON "user_behavior_log" (created_at);
