# PixelDesk 部署全流程指南

本指南详细介绍了如何在 Ubuntu 服务器上使用 Docker Compose 部署 PixelDesk 应用。

## 🛠️ 第一阶段：准备工作

1. **登录服务器**
   使用终端通过 SSH 登录：
   ```bash
   ssh root@你的服务器IP
   ```

2. **更新系统系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## 📦 第二阶段：安装 Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

## 🚀 第三阶段：拉取代码与配置

1. **克隆仓库**
   ```bash
   git clone https://github.com/你的用户名/PixelDesk.git
   cd PixelDesk
   ```

2. **配置文件**
   - 复制 `.env.example` 到 `.env` 并填写真实的数据库密码、密钥和域名。
   - 特别注意 `NEXTAUTH_URL` 应设为 `https://your-domain.com`。

## 🏗️ 第四阶段：反向代理配置 (已有 Nginx 方案)

由于应用运行在 Docker 内，我们建议直接在宿主机 Nginx 中进行转发。

1. **申请 SSL 证书**
   ```bash
   sudo apt install certbot -y
   sudo certbot certonly --standalone -d your-domain.com
   ```

2. **Nginx 站点配置** (`/etc/nginx/sites-available/default`)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

       # 安全增强协议
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;

       location / {
           proxy_pass http://127.0.0.1:3010;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

## 🏁 第五阶段：启动与维护

1. **启动容器**
   ```bash
   docker compose up -d --build
   ```

2. **同步数据库**
   ```bash
   docker compose exec app npx prisma db push
   ```

3. **常用维护命令**
   - 查看日志：`docker compose logs -f app`
   - 停止服务：`docker compose down`

---

## 💡 常见问题排查 (FAQ)

### 1. 浏览器显示 "Not Secure"？
- 检查 Nginx 协议是否包含 TLS 1.2/1.3。
- 确认 `.env` 中的 `NEXTAUTH_URL` 是 `https` 开头。

### 2. 移动端底部 TabBar 消失或遮挡？
- 确认 `LayoutManager` 使用了 `h-full-dvh` 样式。
- 确认 `index.html` 的 Viewport 包含 `viewport-fit=cover`。

### 3. 502 Bad Gateway？
- 检查容器是否正常启动：`docker compose ps`。
- 确保 `server.js` 监听的是 `0.0.0.0` 而非 `localhost`。
