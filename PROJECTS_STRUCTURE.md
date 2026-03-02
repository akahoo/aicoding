# 📁 项目结构说明

## 目录组织原则

每个独立项目都放在根目录下的独立文件夹中，便于管理和部署。

---

## 当前项目

### 🃏 game-guandan/ - 掼蛋在线扑克游戏

**完整的游戏项目，包含前后端**

```
game-guandan/
├── client/              # 前端 React 应用
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── components/  # 通用组件
│   │   └── ...
│   └── package.json
├── server/              # 后端 Node.js 服务
│   ├── game/            # 游戏逻辑
│   └── package.json
├── README.md            # 项目说明
└── package.json         # 根配置
```

**访问：** https://github.com/akahoo/aicoding/tree/master/game-guandan

---

### 📰 bci-news-fetcher/ - 脑机接口新闻抓取器

**Python 脚本，自动抓取 BCI 行业新闻**

```
bci-news-fetcher/
├── fetch_bci_news.py    # 主脚本
├── requirements.txt     # Python 依赖
└── README.md           # 使用说明
```

---

### ✅ todolist-app/ - Todo List 应用

**简单的待办事项 Web 应用**

```
todolist-app/
├── index.html
├── styles.css
├── script.js
└── README.md
```

---

## 📝 新建项目规范

### 目录命名

- 使用小写字母
- 单词间用连字符 `-` 分隔
- 英文命名（便于国际化）

**示例：**
- ✅ `game-guandan`
- ✅ `bci-news-fetcher`
- ❌ `GameGuandan`
- ❌ `bci_news`

### 必需文件

每个项目至少包含：

```
project-name/
├── README.md       # 项目说明（必需）
├── package.json    # Node.js 项目（如有）
├── requirements.txt # Python 项目（如有）
└── .gitignore      # Git 忽略文件（如需）
```

### README.md 模板

```markdown
# 项目名称

## 简介
一句话描述项目

## 功能
- 功能 1
- 功能 2

## 技术栈
- 前端：React
- 后端：Node.js

## 运行方式
npm install
npm run dev

## 许可证
MIT
```

---

## 🚀 部署建议

### 前端项目

- **Vercel** - React/Vue 静态站点
- **Netlify** - 静态站点 + Serverless Functions
- **GitHub Pages** - 免费静态托管

### 后端项目

- **Railway** - Node.js/Python，免费额度
- **Render** - 免费 Web 服务
- **阿里云/腾讯云** - 国内访问快

### 全栈项目

- **Railway** - 前后端一起部署
- **Docker** - 容器化部署到任意服务器

---

## 📊 项目统计

| 项目 | 语言 | 状态 | 部署 |
|------|------|------|------|
| game-guandan | JavaScript/React | ✅ 完成 | 待部署 |
| bci-news-fetcher | Python | ✅ 完成 | 本地运行 |
| todolist-app | HTML/CSS/JS | ✅ 完成 | 静态页面 |

---

## 🔄 Git 工作流

### 开发新分支

```bash
# 创建新分支
git checkout -b feature/new-project

# 开发完成后合并
git checkout master
git merge feature/new-project

# 推送到 GitHub
git push origin master
```

### 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

---

**最后更新：** 2026 年 3 月 2 日
