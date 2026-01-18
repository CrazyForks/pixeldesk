# PixelDesk 服务器部署指南 (2026.01 更新)

本文档整理了在对 **Prisma Workstation ID** 进行架构调整及执行大批量数据迁移脚本后的服务器部署流程。

## ⚠️ 部署前必须执行：数据库备份

在进行任何破坏性操作（如架构修改或数据迁移）前，请务必备份生产环境数据库。

```bash
# 假设使用 Docker 部署
docker exec -t [DB_CONTAINER_NAME] pg_dump -U pixel_user pixeldesk > pixeldesk_backup_$(date +%Y%m%d).sql

# 如果是裸机部署
pg_dump -U pixel_user pixeldesk > pixeldesk_backup_$(date +%Y%m%d).sql
```

---

## 🚀 部署流程

### 1. 更新代码
同步最新的代码及地图资源。

```bash
git pull origin main
```

### 2. 更新地图 Stable ID (如有必要)
确保 `public/assets/officemap.json` 已经包含了最新的 `ws_id` (UUID)。

```bash
# 在宿主机运行（因为涉及文件同步到 git/容器卷）
npm run update-map-ids
```

### 3. 执行 Prisma 架构变更
由于修改了工位 ID 的类型（从 `Int` 到 `String`），需要从容器内向数据库同步 Schema。务必确保容器已启动并能连接到 DB。

```bash
# 使用 Docker Compose 在应用容器内执行
docker compose exec app npx prisma migrate deploy
```

### 4. 执行数据迁移脚本
这是针对您提到的“工位 ID 修改”后的关键步骤。同样建议在容器内执行，以确保环境一致性。

```bash
# 在应用容器内运行迁移脚本
docker compose exec app node scripts/[您的迁移脚本名称].js
```
> [!NOTE]
> 请确保脚本中的 `DATABASE_URL` 正确指向生产数据库。

### 5. 重启应用服务
更新容器或重启 Node.js 进程。

**使用 Docker Compose:**
```bash
docker compose up --build -d
```

**使用 PM2:**
```bash
npm install
npm run build
pm2 restart all
```

---

## 🔍 部署后验证清单

1.  **工位绑定验证**：进入游戏，尝试绑定一个新工位，检查 `user_workstations` 表中的 `workstationId` 是否为 UUID 格式。
2.  **存量数据验证**：检查老用户是否依然能正确关联到自己的工位。
3.  **日志检查**：查看 API 日志是否有关于 `workstation` 的类型错误。
    ```bash
    tail -f logs/error.log  # 或使用 docker logs
    ```
4.  **地图加载验证**：打开浏览器开发者工具，检查 `officemap.json` 加载是否正常，对象属性中是否包含 `ws_id`。

---

## 🚨 常见问题汇总

*   **Q: 迁移脚本执行超时怎么办？**
    *   A: 对大批量数据使用 Prisma 事务时需注意超时设置，必要时分批次执行。
*   **Q: Prisma 报错 ID 类型不兼容？**
    *   A: 如果 `Int` 转 `String` 在数据库层面受阻，可能需要先通过 SQL 手动 `ALTER TABLE ... TYPE text`。
*   **Q: Docker Build 报错 `permission denied` 访问 `data/postgres`？**
    *   A: 这是因为 Docker 尝试将数据库数据目录包含在构建上下文中。请确保根目录存在 `.dockerignore` 文件并包含 `data` 目录。我已经为您创建了该文件。

---

**维护人员**：Antigravity Assistant
**日期**：2026-01-18
