CREATE TABLE user_post_collection (
                                     id          BIGSERIAL PRIMARY KEY,
                                     user_id     BIGINT NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
                                     folder_name VARCHAR(100) NOT NULL,
    -- 通用字段
                                     created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                     updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                     created_by  VARCHAR(64),
                                     updated_by  VARCHAR(64),
                                     deleted     SMALLINT NOT NULL DEFAULT 0, -- 0=正常 1=已删除
                                     version     INTEGER  NOT NULL DEFAULT 0,
                                     CONSTRAINT uk_user_folder UNIQUE (user_id, folder_name) -- 防重名收藏夹
);

-- 高频索引
CREATE INDEX idx_collection_user       ON user_post_collection(user_id, deleted) WHERE deleted=0;