CREATE TABLE user_post_like (
                                   id          BIGSERIAL PRIMARY KEY,
                                   user_id     BIGINT NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
                                   post_id     BIGINT NOT NULL REFERENCES post(id)     ON DELETE CASCADE,
                                   deleted     SMALLINT NOT NULL DEFAULT 0, -- 0=正常 1=已取消
                                   version     INTEGER  NOT NULL DEFAULT 0,
                                   created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                   updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                   created_by  VARCHAR(64),
                                   updated_by  VARCHAR(64),
                                   CONSTRAINT uk_user_post_like UNIQUE (user_id, post_id)
);

CREATE INDEX idx_like_user       ON user_post_like(user_id, deleted) WHERE deleted=0;
CREATE INDEX idx_like_post       ON user_post_like(post_id, deleted) WHERE deleted=0;
