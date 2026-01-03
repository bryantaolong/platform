CREATE TABLE user_post_collect (
                                   id          BIGSERIAL PRIMARY KEY,
                                   user_id     BIGINT NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
                                   post_id     BIGINT NOT NULL REFERENCES post(id)     ON DELETE CASCADE,
    -- 可选：收藏夹 ID，默认 0 表示“默认收藏夹”
                                   collection_id   BIGINT NOT NULL DEFAULT 0,
    -- 冗余：收藏时快照标题，方便用户侧列表展示，无需回查 post
                                   post_title  VARCHAR(200),
    -- 通用字段
                                   created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                   updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                   created_by  VARCHAR(64),
                                   updated_by  VARCHAR(64),
                                   deleted     SMALLINT NOT NULL DEFAULT 0, -- 0=正常 1=已取消
                                   version     INTEGER  NOT NULL DEFAULT 0,
                                   CONSTRAINT uk_user_post UNIQUE (user_id, post_id) -- 防重收藏
);

-- 高频索引
CREATE INDEX idx_collect_user       ON user_post_collect(user_id, deleted) WHERE deleted=0;
CREATE INDEX idx_collect_post       ON user_post_collect(post_id, deleted) WHERE deleted=0;
CREATE INDEX idx_collect_folder     ON user_post_collect(collection_id, deleted) WHERE deleted=0;