# StudyPal 部署到 Cloudflare 指南

本指南涵盖两种部署方式：**Cloudflare Pages**（推荐）和 **Cloudflare Workers**（高级）。

---

## 快速对比

| 特性 | Cloudflare Pages | Cloudflare Workers |
|------|-----------------|------------------|
| **部署方式** | GitHub 连接，自动构建 | 手动上传或 wrangler CLI |
| **难度** | ⭐ 简单 | ⭐⭐⭐ 较复杂 |
| **成本** | 免费（一定额度） | 免费+按量计费 |
| **适合场景** | 标准 Next.js SSR 应用 | 需要高度定制、多环境 |
| **冷启动** | 毫秒级 | 毫秒级 |
| **环境变量管理** | Dashboard + CLI | wrangler CLI 或 Secrets |

---

## 方式一：Cloudflare Pages 部署（推荐 ⭐）

### 前置要求
- GitHub 账户（代码存储于 GitHub）
- Cloudflare 账户（免费层即可）
- 项目代码已 commit 到 GitHub

### 步骤

#### 1. 准备项目

确保项目根目录包含以下配置文件（已为你生成）：
- `next.config.js` ✓
- `package.json` ✓
- `.gitignore` 包含 `.env.local`（避免泄漏 API key）

#### 2. 连接 GitHub 仓库到 Cloudflare

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 侧边栏找到 **Pages** → 点击 **Create a project**
3. 选择 **Connect to Git**
4. 授权 Cloudflare 访问你的 GitHub 账户
5. 选择 StudyPal 仓库 → 点击 **Begin setup**

#### 3. 构建配置

**Build command**: 
```
npm install && npm run build
```

**Build output directory**: 
```
.next
```

**Root directory**: 
```
/
```

其他选项保持默认，然后点击 **Save and Deploy**。

#### 4. 设置环境变量

部署后，进入 **Settings** → **Environment variables** 并添加：

```
GEMINI_API_KEY = your_actual_gemini_key
OPENAI_API_KEY = your_actual_openai_key （可选）
OPENAI_BASE_URL = https://api.openai.com/v1
OPENAI_MODEL_NAME = gpt-3.5-turbo
```

为每个环境（Production / Preview / Development）单独配置。

#### 5. 部署

配置完成后 Cloudflare 会自动进行首次部署。后续每次 push 到 main 分支都会自动触发新的构建和部署。

**查看部署日志**：Pages → 选择项目 → **Deployments** 查看历史

---

## 方式二：Cloudflare Workers 部署（高级用户）

适合需要更多控制和定制的场景。

### 前置要求
- Cloudflare 账户（付费或免费 + Workers 套餐）
- 本地安装 Wrangler CLI：
  ```bash
  npm install -g wrangler
  ```
- 项目本地环境配置完成

### 步骤

#### 1. 初始化 Wrangler 配置

项目已包含 `wrangler.toml`，需要填入你的账户信息：

```bash
wrangler whoami  # 验证 Cloudflare 登录
```

编辑 `wrangler.toml`，填入：
- `account_id`: 你的 Cloudflare Account ID（从 Dashboard 的 Account 页面获取）

```toml
account_id = "your-account-id-here"
```

#### 2. 配置环境变量和 Secrets

**本地开发**：使用 `.env.local`（已生成，填入实际值）

**生产环境 Secrets**（API key 等敏感信息）：
```bash
wrangler secret put GEMINI_API_KEY --env production
# 按提示输入密钥，支持粘贴多行
```

或为 staging 环境：
```bash
wrangler secret put GEMINI_API_KEY --env staging
```

**查看已设置的 Secrets**：
```bash
wrangler secret list --env production
```

#### 3. 本地测试

```bash
wrangler dev --local
```

打开 http://localhost:3000 验证功能正常

#### 4. 构建和部署

```bash
npm run build
wrangler deploy --env production
```

部署完成后输出会显示应用 URL（e.g., `https://studypal.your-account.workers.dev`）

#### 5. 绑定自定义域名（可选）

在 Cloudflare Dashboard：
1. Workers 路由 → 添加路由
2. 填入 `example.com/*` 并绑定到你的 Workers 服务
3. 确保域名已添加到 Cloudflare 并设置为你的 DNS 提供商

---

## 环境变量管理指南

### Pages 环境变量（推荐用 Dashboard UI）

1. 在 Cloudflare Dashboard 进入你的 Pages 项目
2. 选择 **Settings** → **Environment variables**
3. 为不同环境配置：
   - **Production**: 实际 API key
   - **Preview**: 测试 key（可选）
   - **Development**: 本地 dev key

### Workers 环境变量与 Secrets

**变量**（明文，不敏感）：
```bash
wrangler secret put MY_VAR --env production
```

**从 Dashboard 管理**：
- Workers → 选择服务 → Settings → Variables

### 本地 vs 远端一致性

| 配置项 | 本地 | Pages | Workers |
|--------|------|-------|---------|
| GEMINI_API_KEY | .env.local | Dashboard UI | wrangler secret put |
| NODE_ENV | .env.local | 自动 (production) | 自动 (production) |

**最佳实践**：
- 所有 secret（API key）只在 Dashboard 或 CLI 中配置，**不要** commit 到 git
- 本地使用 `.env.local`，该文件应在 `.gitignore` 中
- 生产和测试环境分别配置不同的 key

---

## 常见问题与排查

### Q1: 部署后出现 "API error" 或 500 错误

**检查清单**：
1. 确认环境变量已正确设置（Dashboard 检查）：
   ```
   GEMINI_API_KEY=your_key
   OPENAI_API_KEY=your_key
   ```
2. 本地 `npm run build` 是否成功（查看构建日志）
3. 通过 curl 测试 API 端点：
   ```bash
   curl -X POST https://your-domain/api/chat \
     -H "Content-Type: application/json" \
     -d '{"history":[],"newText":"hello","newAttachments":[],"provider":"google"}'
   ```

### Q2: 超时错误（Cloudflare Workers 特定）

Workers 请求超时上限为 30 秒。若 API 调用太慢：
- 检查 Google Gemini / OpenAI API 响应时间
- 考虑在 wrangler.toml 中配置更高的超时（如果支持）
- 切换到 Cloudflare Pages（无超时限制）

### Q3: 冷启动时间过长

**Pages**：Next.js SSR 缓存会自动处理，首次 ~1-3 秒  
**Workers**：Worker 本身秒启，但 API 调用延迟由上游决定

### Q4: 如何查看部署日志

**Pages**：
```
Dashboard → Pages → 项目 → Deployments → 选择部署 → View build log
```

**Workers**：
```bash
wrangler tail --env production
```

---

## 本地验证部署前

部署前在本地完整测试：

```bash
# 1. 清理旧构建
rm -rf .next

# 2. 安装依赖
npm ci

# 3. 构建
npm run build

# 4. 启动生产模式
NODE_ENV=production npm start

# 5. 测试 API
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"history":[],"newText":"test","newAttachments":[],"provider":"google"}'
```

预期返回 JSON: `{"text":"...response from Gemini/OpenAI..."}`

---

## 部署流程总结（Pages 推荐）

### 首次部署
1. ✅ 代码 push 到 GitHub
2. ✅ Cloudflare Dashboard → Pages → Connect Git
3. ✅ 配置构建命令和环境变量
4. ✅ 部署完成，获得 URL

### 后续更新
1. 编辑代码 → commit → push 到 main 分支
2. Cloudflare 自动触发构建和部署
3. 查看 Deployments 历史验证部署状态

### 环境变量更新
1. Cloudflare Dashboard → Pages 项目 → Settings → Environment variables
2. 修改变量值
3. 点击 Save，变量立即生效（下次请求时）
4. 若需强制重新部署，可在 Deployments 中点击 "Retry"

---

## 费用估算

### Cloudflare Pages（推荐）
- **免费额度**：每月 500 次构建、无限请求
- **超出费用**：¥2.5/100 次构建（大多数项目不会超出）

### Cloudflare Workers
- **免费额度**：每天 100,000 次请求、10ms CPU 时间
- **超出费用**：¥0.5 / 百万次请求 + 用量计费
- 适合高流量应用

**推荐**：采用 Pages + Workers 混合模式（Pages 处理 SSR，必要时用 Workers 实现特定功能）

---

## 部署后检查清单

- [ ] 访问部署 URL，页面能正常加载
- [ ] 切换到 "Gemini老师"，发送消息，收到回复
- [ ] 切换到 "OpenAI老师"，发送消息，收到回复
- [ ] 测试上传图片功能（如有）
- [ ] 检查 Cloudflare Analytics（可选）
- [ ] 配置自定义域名（如需）
- [ ] 设置 SSL/TLS（Pages 自动处理，Workers 若用自定义域需手动配置）

---

## 下一步

- 若需要数据库，考虑使用 **Cloudflare D1**（SQLite）或 **Neon**（PostgreSQL）
- 若需要文件存储，使用 **Cloudflare R2**（S3 兼容对象存储）
- 若需要更复杂的后端逻辑，可将 API routes 迁移到 **Cloudflare Workers**

有任何部署问题，贴出部署日志或错误信息我可以继续排查！
