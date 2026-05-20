-- Go migration: Initial schema (matching Java backend)
-- Run: psql -h localhost -U platform_user -d platform -f 001_init.sql

-- sys_user
CREATE SEQUENCE IF NOT EXISTS user_id_seq;

CREATE TABLE IF NOT EXISTS "sys_user" (
    id                  BIGINT DEFAULT nextval('user_id_seq'::regclass) NOT NULL PRIMARY KEY,
    username            VARCHAR(255) NOT NULL,
    password            VARCHAR(255) NOT NULL,
    phone               VARCHAR(50),
    email               VARCHAR(255),
    status              INTEGER DEFAULT 0,
    roles               VARCHAR(255),
    last_login_at       TIMESTAMP,
    last_login_ip       VARCHAR(255),
    last_login_device   VARCHAR(255),
    password_reset_at   TIMESTAMP,
    login_fail_count    INTEGER DEFAULT 0,
    locked_at           TIMESTAMP,
    deleted             INTEGER DEFAULT 0 NOT NULL,
    version             INTEGER DEFAULT 0 NOT NULL,
    created_at          TIMESTAMP DEFAULT now() NOT NULL,
    updated_at          TIMESTAMP DEFAULT now() NOT NULL,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_username ON "sys_user" (username);

-- user_role
CREATE TABLE IF NOT EXISTS user_role (
    id         INTEGER NOT NULL PRIMARY KEY,
    role_name  VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    deleted    INTEGER DEFAULT 0 NOT NULL,
    version    INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_user_role_default_true ON user_role (is_default) WHERE (is_default = true);

-- Insert default roles (idempotent)
INSERT INTO user_role (id, role_name, is_default, deleted, version, created_at, updated_at)
VALUES (1, 'ROLE_ADMIN', false, 0, 0, now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_role (id, role_name, is_default, deleted, version, created_at, updated_at)
VALUES (2, 'ROLE_USER', true, 0, 0, now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_role (id, role_name, is_default, deleted, version, created_at, updated_at)
VALUES (3, 'ROLE_MODERATOR', false, 0, 0, now(), now())
ON CONFLICT (id) DO NOTHING;

-- user_profile
CREATE TABLE IF NOT EXISTS "user_profile" (
    user_id   BIGINT PRIMARY KEY,
    real_name VARCHAR(255),
    gender    INTEGER,
    birthday  TIMESTAMP,
    avatar    VARCHAR(255),
    deleted   INTEGER DEFAULT 0 NOT NULL,
    version   INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- user_follow
CREATE TABLE IF NOT EXISTS user_follow (
    id           BIGSERIAL PRIMARY KEY,
    follower_id  BIGINT NOT NULL,
    following_id BIGINT NOT NULL,
    deleted      INTEGER DEFAULT 0 NOT NULL,
    version      INTEGER DEFAULT 0 NOT NULL,
    created_at   TIMESTAMP DEFAULT now() NOT NULL,
    updated_at   TIMESTAMP DEFAULT now() NOT NULL,
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_user_follow_follower ON user_follow (follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follow_following ON user_follow (following_id);

-- user_message
CREATE TABLE IF NOT EXISTS user_message (
    id          BIGSERIAL PRIMARY KEY,
    sender_id   BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content     TEXT,
    status      INTEGER DEFAULT 0,
    read_status INTEGER DEFAULT 0,
    read_at     TIMESTAMP,
    recalled_at TIMESTAMP,
    deleted     INTEGER DEFAULT 0 NOT NULL,
    version     INTEGER DEFAULT 0 NOT NULL,
    created_at  TIMESTAMP DEFAULT now() NOT NULL,
    updated_at  TIMESTAMP DEFAULT now() NOT NULL,
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_user_message_sender ON user_message (sender_id);
CREATE INDEX IF NOT EXISTS idx_user_message_receiver ON user_message (receiver_id);

-- user_profile_interest
CREATE TABLE IF NOT EXISTS user_profile_interest (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    interest_tag VARCHAR(255),
    weight       DOUBLE PRECISION,
    source       VARCHAR(255),
    deleted      INTEGER DEFAULT 0 NOT NULL,
    version      INTEGER DEFAULT 0 NOT NULL,
    created_at   TIMESTAMP DEFAULT now() NOT NULL,
    updated_at   TIMESTAMP DEFAULT now() NOT NULL,
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_user_profile_interest_user ON user_profile_interest (user_id);

-- user_behavior_log
CREATE TABLE IF NOT EXISTS user_behavior_log (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    post_id          BIGINT,
    behavior_type    VARCHAR(50),
    duration_seconds INTEGER,
    deleted          INTEGER DEFAULT 0 NOT NULL,
    version          INTEGER DEFAULT 0 NOT NULL,
    created_at       TIMESTAMP DEFAULT now() NOT NULL,
    updated_at       TIMESTAMP DEFAULT now() NOT NULL,
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_user_behavior_user ON user_behavior_log (user_id);

-- post
CREATE TABLE IF NOT EXISTS post (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            BIGINT NOT NULL,
    title              VARCHAR(255),
    content            TEXT,
    status             INTEGER DEFAULT 0,
    category_id        BIGINT,
    tags               TEXT,
    comment_area_status INTEGER DEFAULT 0,
    view_count         BIGINT DEFAULT 0,
    like_count         BIGINT DEFAULT 0,
    comment_count      BIGINT DEFAULT 0,
    collect_count      BIGINT DEFAULT 0,
    share_count        BIGINT DEFAULT 0,
    weight             INTEGER DEFAULT 0,
    deleted            INTEGER DEFAULT 0 NOT NULL,
    version            INTEGER DEFAULT 0 NOT NULL,
    created_at         TIMESTAMP DEFAULT now() NOT NULL,
    updated_at         TIMESTAMP DEFAULT now() NOT NULL,
    created_by         VARCHAR(255),
    updated_by         VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_post_user ON post (user_id);

-- post_comment
CREATE TABLE IF NOT EXISTS post_comment (
    id                BIGSERIAL PRIMARY KEY,
    post_id           BIGINT NOT NULL,
    user_id           BIGINT NOT NULL,
    username          VARCHAR(255),
    avatar            VARCHAR(255),
    root_id           BIGINT,
    parent_id         BIGINT,
    type              INTEGER DEFAULT 0,
    content           TEXT,
    reply_to_user_id  BIGINT,
    reply_to_username VARCHAR(255),
    floor             INTEGER,
    like_count        BIGINT DEFAULT 0,
    dislike_count     BIGINT DEFAULT 0,
    child_count       BIGINT DEFAULT 0,
    path              TEXT,
    status            INTEGER DEFAULT 0,
    deleted           INTEGER DEFAULT 0 NOT NULL,
    version           INTEGER DEFAULT 0 NOT NULL,
    created_at        TIMESTAMP DEFAULT now() NOT NULL,
    updated_at        TIMESTAMP DEFAULT now() NOT NULL,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_post_comment_post ON post_comment (post_id);

-- user_post_like
CREATE TABLE IF NOT EXISTS user_post_like (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    post_id    BIGINT NOT NULL,
    deleted    INTEGER DEFAULT 0 NOT NULL,
    version    INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_user_post UNIQUE (user_id, post_id)
);

-- user_comment_like
CREATE TABLE IF NOT EXISTS user_comment_like (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    comment_id BIGINT NOT NULL,
    deleted    INTEGER DEFAULT 0 NOT NULL,
    version    INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_user_comment UNIQUE (user_id, comment_id)
);

-- user_post_collect
CREATE TABLE IF NOT EXISTS user_post_collect (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    post_id       BIGINT NOT NULL,
    collection_id BIGINT DEFAULT 0,
    post_title    VARCHAR(255),
    deleted       INTEGER DEFAULT 0 NOT NULL,
    version       INTEGER DEFAULT 0 NOT NULL,
    created_at    TIMESTAMP DEFAULT now() NOT NULL,
    updated_at    TIMESTAMP DEFAULT now() NOT NULL,
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_user_post_collect_user ON user_post_collect (user_id);

-- user_post_collection
CREATE TABLE IF NOT EXISTS user_post_collection (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    folder_name VARCHAR(255),
    deleted     INTEGER DEFAULT 0 NOT NULL,
    version     INTEGER DEFAULT 0 NOT NULL,
    created_at  TIMESTAMP DEFAULT now() NOT NULL,
    updated_at  TIMESTAMP DEFAULT now() NOT NULL,
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_user_post_collection_user ON user_post_collection (user_id);

-- post_hot_rank_algorithm
CREATE TABLE IF NOT EXISTS post_hot_rank_algorithm (
    id           BIGSERIAL PRIMARY KEY,
    metric_key   VARCHAR(50) NOT NULL,
    metric_value DOUBLE PRECISION,
    description  VARCHAR(255),
    deleted      INTEGER DEFAULT 0 NOT NULL,
    version      INTEGER DEFAULT 0 NOT NULL,
    created_at   TIMESTAMP DEFAULT now() NOT NULL,
    updated_at   TIMESTAMP DEFAULT now() NOT NULL,
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255)
);

-- Insert default algorithm weights
INSERT INTO post_hot_rank_algorithm (metric_key, metric_value, description, deleted, version, created_at, updated_at)
VALUES 
    ('view', 0.1, '浏览量权重', 0, 0, now(), now()),
    ('like', 0.3, '点赞权重', 0, 0, now(), now()),
    ('comment', 0.25, '评论权重', 0, 0, now(), now()),
    ('collect', 0.2, '收藏权重', 0, 0, now(), now()),
    ('share', 0.1, '分享权重', 0, 0, now(), now()),
    ('manual', 0.05, '手动权重', 0, 0, now(), now())
ON CONFLICT DO NOTHING;
