# 🔧 快速修复指南

## 问题原因
`postcss.config.js` 使用了 CommonJS 语法（`module.exports`），但 `package.json` 设置了 `"type": "module"`，导致 Vite 无法加载。

## 解决方案

### 方案 1：拉取最新代码（推荐）

```bash
cd /Users/lordz/Desktop/Code/aicoding/aicoding-game-guandan
git checkout game-guandan
git pull origin game-guandan
```

然后重新启动：
```bash
npm run dev
```

### 方案 2：手动修改文件

编辑 `client/postcss.config.js`：

**修改前：**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**修改后：**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

然后重新启动：
```bash
npm run dev
```

---

## 完整启动流程

```bash
# 终端 1：启动后端
cd /Users/lordz/Desktop/Code/aicoding/aicoding-game-guandan/server
npm install  # 首次运行
npm run dev

# 终端 2：启动前端
cd /Users/lordz/Desktop/Code/aicoding/aicoding-game-guandan/client
npm install  # 首次运行
npm run dev
```

访问：http://localhost:3000

---

**GitHub 已更新：** https://github.com/akahoo/aicoding/tree/game-guandan
