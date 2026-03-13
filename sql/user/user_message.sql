CREATE TABLE user_message (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    status INTEGER DEFAULT 0 NOT NULL,
    read_status INTEGER DEFAULT 0 NOT NULL,
    read_at TIMESTAMP,
    recalled_at TIMESTAMP,
    deleted INTEGER DEFAULT 0 NOT NULL,
    version INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

COMMENT ON TABLE user_message IS 'User direct messages';
COMMENT ON COLUMN user_message.id IS 'Primary key';
COMMENT ON COLUMN user_message.sender_id IS 'Sender user id';
COMMENT ON COLUMN user_message.receiver_id IS 'Receiver user id';
COMMENT ON COLUMN user_message.content IS 'Message content';
COMMENT ON COLUMN user_message.status IS 'Message status: 0-normal, 1-recalled';
COMMENT ON COLUMN user_message.read_status IS 'Read status: 0-unread, 1-read';
COMMENT ON COLUMN user_message.read_at IS 'Read timestamp';
COMMENT ON COLUMN user_message.recalled_at IS 'Recalled timestamp';
COMMENT ON COLUMN user_message.created_at IS 'Sent timestamp';

ALTER TABLE user_message
    ADD CONSTRAINT fk_user_message_sender
        FOREIGN KEY (sender_id) REFERENCES sys_user (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE user_message
    ADD CONSTRAINT fk_user_message_receiver
        FOREIGN KEY (receiver_id) REFERENCES sys_user (id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX idx_user_message_sender_id ON user_message (sender_id);
CREATE INDEX idx_user_message_receiver_id ON user_message (receiver_id);
CREATE INDEX idx_user_message_created_at ON user_message (created_at);
CREATE INDEX idx_user_message_read_status ON user_message (receiver_id, read_status);
CREATE INDEX idx_user_message_conversation ON user_message (sender_id, receiver_id, created_at);
