# PixelDesk 数据库部署指南

## 📋 概述

本文档记录了 PixelDesk 项目的数据库部署过程，包括 PostgreSQL 配置、Redis 安装和数据库表结构创建。

## 🖥️ 服务器信息

- **服务器类型**: 云服务器
- **数据库**: PostgreSQL (已安装)
- **缓存**: Redis (待安装)
- **部署用户**: 需要有 sudo 权限的用户

## 📋 部署清单

### ✅ 已完成
- [x] PostgreSQL 安装
- [ ] Redis 安装和配置
- [ ] 数据库创建
- [ ] 用户和权限设置
- [ ] 表结构创建
- [ ] 连接测试
- [ ] 安全配置

## 🚀 部署步骤

### 1. 检查 PostgreSQL 状态

```bash
# 检查 PostgreSQL 服务状态
sudo systemctl status postgresql

# 检查 PostgreSQL 版本
psql --version

# 查看 PostgreSQL 运行端口
sudo netstat -tlnp | grep postgres
```

### 2. 安装 Redis

```bash
# 更新包管理器
sudo apt update

# 安装 Redis
sudo apt install redis-server -y

# 启动 Redis 服务
sudo systemctl start redis-server

# 设置 Redis 开机自启
sudo systemctl enable redis-server

# 检查 Redis 服务状态
sudo systemctl status redis-server

# 测试 Redis 连接
redis-cli ping
# 应该返回: PONG
```

### 3. 配置 Redis

```bash
# 编辑 Redis 配置文件
sudo nano /etc/redis/redis.conf

# 修改以下配置项:
# bind 127.0.0.1 ::1  ->  bind 0.0.0.0  (允许远程连接)
# supervised no      ->  supervised systemd  (使用 systemd 管理)
# # requirepass foobared -> requirepass your_redis_password  (设置密码)

# 重启 Redis 服务
sudo systemctl restart redis-server

# 验证 Redis 配置
redis-cli -h 127.0.0.1 -p 6379 ping
```

### 4. 创建数据库和用户

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 PostgreSQL shell 中执行以下命令:

-- 创建数据库
CREATE DATABASE pixeldesk;
ALTER USER pixel_user WITH PASSWORD 'your_new_secure_password';
-- 创建数据库用户
CREATE USER pixel_user WITH PASSWORD 'your_secure_password';

-- 授权用户访问数据库
GRANT ALL PRIVILEGES ON DATABASE pixeldesk TO pixel_user;

-- 创建扩展 (如果需要 JSON 支持)
\c pixeldesk;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 退出 PostgreSQL shell
\q
```

### 5. 创建数据库表结构

```bash
# 创建表结构文件
nano /tmp/pixeldesk_schema.sql
```

复制以下 SQL 内容到文件中：

```sql
-- PixelDesk 数据库表结构
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
```

```bash
# 执行表结构创建
sudo -u postgres psql -d pixeldesk -f /tmp/pixeldesk_schema.sql
```

### 6. 插入初始数据

```bash
# 创建初始数据文件
nano /tmp/pixeldesk_init_data.sql
```

```sql
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

-- 插入示例用户数据 (可选)
-- INSERT INTO users (username, character_type, points) VALUES
-- ('demo_user', 'Premade_Character_48x48_01', 100);
```

```bash
# 执行初始数据插入
sudo -u postgres psql -d pixeldesk -f /tmp/pixeldesk_init_data.sql
```

### 7. 配置数据库访问权限

```bash
# 编辑 PostgreSQL 配置文件
sudo nano /etc/postgresql/*/main/pg_hba.conf

# 添加以下行到文件末尾 (允许远程连接):
# host    pixeldesk    pixel_user    0.0.0.0/0    md5

# 编辑 postgresql.conf
sudo nano /etc/postgresql/*/main/postgresql.conf

# 修改监听地址:
# listen_addresses = 'localhost' -> listen_addresses = '*'

# 重启 PostgreSQL 服务
sudo systemctl restart postgresql
```

### 8. 防火墙配置

```bash
# 如果使用 ufw 防火墙
sudo ufw allow 5432/tcp    # PostgreSQL
sudo ufw allow 6379/tcp    # Redis
sudo ufw reload

# 如果使用 iptables
sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 6379 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

### 9. 数据库连接测试

```bash
# 本地连接测试
psql -h localhost -U pixel_user -d pixeldesk

# 远程连接测试 (从开发机器)
psql -h YOUR_SERVER_IP -U pixel_user -d pixeldesk

# Redis 连接测试
redis-cli -h YOUR_SERVER_IP -p 6379 -a your_redis_password ping
```

## 🔧 环境变量配置

在项目根目录创建 `.env.local` 文件：

```bash
# 数据库连接配置
DATABASE_URL="postgresql://pixel_user:your_secure_password@YOUR_SERVER_IP:5432/pixeldesk"

# Redis 连接配置
REDIS_URL="redis://:your_redis_password@YOUR_SERVER_IP:6379"

# JWT 密钥
JWT_SECRET="your_jwt_secret_key_here"

# 应用配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_here"
```

## 📊 数据库维护

### 备份数据库

```bash
# 创建备份
sudo -u postgres pg_dump pixeldesk > pixeldesk_backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
sudo -u postgres psql pixeldesk < pixeldesk_backup_20240101_120000.sql
```

### 监控数据库

```bash
# 查看数据库连接数
sudo -u postgres psql -d pixeldesk -c "SELECT count(*) FROM pg_stat_activity;"

# 查看数据库大小
sudo -u postgres psql -d pixeldesk -c "SELECT pg_size_pretty(pg_database_size('pixeldesk'));"

# 查看表大小
sudo -u postgres psql -d pixeldesk -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname = 'public';"
```

## 🔒 安全建议

1. **使用强密码**: 确保数据库用户密码足够复杂
2. **限制访问**: 使用防火墙限制数据库端口访问
3. **定期备份**: 设置定期备份策略
4. **监控日志**: 定期检查数据库访问日志
5. **更新系统**: 保持系统和数据库软件更新

## 🚨 故障排除

### 常见问题

1. **连接被拒绝**: 检查防火墙和 PostgreSQL 配置
2. **权限不足**: 确保用户有正确的数据库权限
3. **端口占用**: 检查端口是否被其他服务占用

### 日志查看

```bash
# PostgreSQL 日志
sudo tail -f /var/log/postgresql/postgresql-*.log

# Redis 日志
sudo tail -f /var/log/redis/redis-server.log
```

## 📝 部署检查清单

- [ ] PostgreSQL 服务正常运行
- [ ] Redis 服务正常运行
- [ ] 数据库 pixeldesk 创建成功
- [ ] 用户 pixel_user 创建成功并有权限
- [ ] 所有表结构创建成功
- [ ] 初始数据插入成功
- [ ] 远程连接测试成功
- [ ] 防火墙配置正确
- [ ] 环境变量配置完成
- [ ] 备份策略制定

---

**最后更新**: 2025-08-10
**维护人员**: PixelDesk 团队