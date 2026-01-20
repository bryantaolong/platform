CREATE TABLE user_comment_like (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    comment_id  BIGINT NOT NULL REFERENCES post_comment(id) ON DELETE CASCADE,
    deleted     SMALLINT NOT NULL DEFAULT 0,
    version     INTEGER  NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(64),
    updated_by  VARCHAR(64),
    CONSTRAINT uk_user_comment_like UNIQUE (user_id, comment_id)
);

CREATE INDEX idx_comment_like_user       ON user_comment_like(user_id, deleted) WHERE deleted=0;
CREATE INDEX idx_comment_like_comment    ON user_comment_like(comment_id, deleted) WHERE deleted=0;
