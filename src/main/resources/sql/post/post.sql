CREATE TABLE post (
                      id               BIGSERIAL PRIMARY KEY,
                      user_id          BIGINT       NOT NULL REFERENCES sys_user(id),
                      title            VARCHAR(200) NOT NULL,
                      summary          VARCHAR(500),
                      content          TEXT         NOT NULL,
                      cover_url        VARCHAR(500),
                      status           SMALLINT     NOT NULL DEFAULT 1,   -- 1=已发布 2=草稿 3=仅自己可见 4=审核中 5=回收站
                      category_id      BIGINT,
                      tags             TEXT[],                              -- PostgreSQL 数组类型，查询时用 ANY(tags)
                      comment_area_status   SMALLINT     NOT NULL DEFAULT 1,   -- 1=开启 0=关闭
                      view_count       BIGINT       NOT NULL DEFAULT 0,
                      like_count       BIGINT       NOT NULL DEFAULT 0,
                      comment_count    BIGINT       NOT NULL DEFAULT 0,
                      collect_count    BIGINT       NOT NULL DEFAULT 0,
                      share_count      BIGINT       NOT NULL DEFAULT 0,
                      weight           INTEGER      NOT NULL DEFAULT 0,    -- 人工置顶权重，越大越靠前
                      published_at     TIMESTAMP,
                      created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      created_by       VARCHAR(64),
                      updated_by       VARCHAR(64),
                      deleted          SMALLINT     NOT NULL DEFAULT 0,   -- 逻辑删除 0=正常 1=删除
                      version          INTEGER      NOT NULL DEFAULT 0,   -- 乐观锁
                      CONSTRAINT uk_post_user_title UNIQUE (user_id, title)  -- 避免同一用户重复标题
);

-- 常用索引
CREATE INDEX idx_post_user_id      ON post(user_id)      WHERE deleted = 0;
CREATE INDEX idx_post_status       ON post(status)        WHERE deleted = 0;
CREATE INDEX idx_post_published_at ON post(published_at) WHERE deleted = 0;
CREATE INDEX idx_post_weight       ON post(weight DESC, published_at DESC) WHERE deleted = 0;
-- GIN 索引用于数组标签
CREATE INDEX idx_post_tags_gin     ON post USING GIN(tags);
-- 分区提示：数据量过亿可按月分区
-- CREATE TABLE post_202512 PARTITION OF post FOR VALUES FROM ('2025-12-01') TO ('2025-12-31');