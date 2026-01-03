CREATE TABLE post_comment (
                              id                BIGSERIAL PRIMARY KEY,
                              post_id           BIGINT       NOT NULL REFERENCES post(id) ON DELETE CASCADE,
                              root_id           BIGINT       NOT NULL,   -- 根评论ID，顶级评论时=自身ID
                              parent_id         BIGINT       NOT NULL DEFAULT 0, -- 0 表示一级评论
                              type              SMALLINT     NOT NULL CHECK (type IN (1,2)), -- 1=评论 2=回复
                              content           TEXT         NOT NULL,
                              reply_to_user_id  BIGINT,                 -- 被回复人，NULL 表示回复整楼
                              floor             INTEGER,                 -- 楼层号，只在 root_id=id 时赋值
                              like_count        BIGINT       NOT NULL DEFAULT 0,
                              dislike_count     BIGINT       NOT NULL DEFAULT 0,
                              child_count       BIGINT       NOT NULL DEFAULT 0, -- 直接子节点数，用于展示「共X条回复」
                              path              LTREE,                   -- 物化路径，顶级评论值为 id::text::ltree
                              status            SMALLINT     NOT NULL DEFAULT 1, -- 1=正常 2=待审 3=隐藏 4=删除(逻辑删已够用)
                              created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                              updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                              created_by        VARCHAR(64),
                              updated_by        VARCHAR(64),
                              deleted           SMALLINT     NOT NULL DEFAULT 0, -- 逻辑删除
                              version           INTEGER      NOT NULL DEFAULT 0, -- 乐观锁
                              CONSTRAINT uk_root_floor UNIQUE (root_id, floor) -- 每根楼楼层号唯一
);

-- 必备索引
CREATE INDEX idx_comment_post_root   ON post_comment(post_id, root_id) WHERE deleted=0;
CREATE INDEX idx_comment_parent      ON post_comment(parent_id)        WHERE deleted=0;
CREATE INDEX idx_comment_path_btree  ON post_comment USING btree(path);
CREATE INDEX idx_comment_created     ON post_comment(created_at DESC)  WHERE deleted=0 AND type=1; -- 最新一级评论
CREATE INDEX idx_comment_hot         ON post_comment(like_count DESC)  WHERE deleted=0 AND type=1; -- 热评
-- GIN 索引加速全文检索（可选）
ALTER TABLE post_comment ADD COLUMN ts tsvector GENERATED ALWAYS (to_tsvector('simple', content)) STORED;
CREATE INDEX idx_comment_fts ON post_comment USING GIN(ts);