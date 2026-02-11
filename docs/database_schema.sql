-- PixelDesk 数据库表结构
-- 请在 PostgreSQL 中执行此脚本

-- 连接到数据库: \c pixeldesk

-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    character_type VARCHAR(100) NOT NULL,
    points INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 状态历史表
CREATE TABLE status_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status_type VARCHAR(50) NOT NULL,
    status_text VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工位表
CREATE TABLE workstations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    x_position INTEGER NOT NULL,
    y_position INTEGER NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户工位绑定表
CREATE TABLE user_workstations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    workstation_id INTEGER REFERENCES workstations(id) ON DELETE CASCADE,
    bound_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unbound_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 用户会话表
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_status_history_user_id ON status_history(user_id);
CREATE INDEX idx_status_history_created_at ON status_history(created_at);
CREATE INDEX idx_user_workstations_user_id ON user_workstations(user_id);
CREATE INDEX idx_user_workstations_workstation_id ON user_workstations(workstation_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 users 表添加更新时间触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 插入示例工位数据
INSERT INTO workstations (name, x_position, y_position) VALUES
('工位 A1', 100, 100),
('工位 A2', 200, 100),
('工位 A3', 300, 100),
('工位 B1', 100, 200),
('工位 B2', 200, 200),
('工位 B3', 300, 200),
('工位 C1', 100, 300),
('工位 C2', 200, 300),
('工位 C3', 300, 300);

-- 创建数据库用户并授权
-- 这些命令需要在创建数据库后执行
-- CREATE USER pixel_user WITH PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE pixeldesk TO pixel_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pixel_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pixel_user;