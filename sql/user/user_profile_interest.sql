-- user_profile_interest
CREATE TABLE "user_profile_interest"
(
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT                                              NOT NULL,
    interest_tag VARCHAR(50)                                         NOT NULL,
    weight       DOUBLE PRECISION DEFAULT 0                          NOT NULL,
    source       VARCHAR(20),                                              -- 来源：like/collect/comment/share/view
    deleted      INTEGER          DEFAULT 0                          NOT NULL,
    version      INTEGER          DEFAULT 0                          NOT NULL,
    created_at   TIMESTAMP        DEFAULT NOW()                     NOT NULL,
    updated_at   TIMESTAMP        DEFAULT NOW()                     NOT NULL,
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255),
    UNIQUE (user_id, interest_tag)
);

COMMENT ON TABLE "user_profile_interest" IS '用户兴趣画像表，存储用户的兴趣标签及权重';
COMMENT ON COLUMN "user_profile_interest".id IS '主键ID';
COMMENT ON COLUMN "user_profile_interest".user_id IS '用户ID，关联sys_user表';
COMMENT ON COLUMN "user_profile_interest".interest_tag IS '兴趣标签';
COMMENT ON COLUMN "user_profile_interest".weight IS '兴趣权重';
COMMENT ON COLUMN "user_profile_interest".source IS '来源类型：like(点赞)/collect(收藏)/comment(评论)/share(分享)/view(浏览)';
COMMENT ON COLUMN "user_profile_interest".deleted IS '软删除标记(0-未删除 1-已删除)';
COMMENT ON COLUMN "user_profile_interest".version IS '乐观锁版本号';
COMMENT ON COLUMN "user_profile_interest".created_at IS '记录创建时间';
COMMENT ON COLUMN "user_profile_interest".updated_at IS '记录更新时间';
COMMENT ON COLUMN "user_profile_interest".created_by IS '记录创建人';
COMMENT ON COLUMN "user_profile_interest".updated_by IS '记录更新人';

CREATE INDEX idx_user_interest_user_id ON "user_profile_interest" (user_id);
CREATE INDEX idx_user_interest_weight ON "user_profile_interest" (weight DESC);
