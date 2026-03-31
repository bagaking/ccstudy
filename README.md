# ccstudy

`ccstudy` 是一个面向学习与复现的独立仓库。

这里保留了完整的 `claude-code-source`，并额外配了一套中英双语学习站点。  
同时也是 **能够在本地重新构建并运行源码本体**。

## 目录

```text
ccstudy/
  source/
    claude-code-source/      # 完整源码树
  site/
    ...                      # 学习站点与 GitHub Pages 产物源
```

## 如何构建源码

### 1. 环境依赖

- Bun `1.3.x`
- pnpm `10+`
- Node.js `18+`

### 2. 安装依赖

```bash
cd ~/proj/priv/bagaking/ccstudy/source/claude-code-source
pnpm install --registry https://registry.npmjs.org
```

### 3. 构建

```bash
bun run build.ts
```

构建产物：

- `dist/cli.js`

### 4. 运行验证

```bash
bun dist/cli.js --version
bun dist/cli.js --help
```

如果你只是想直接跑：

```bash
bun dist/cli.js
```

## 学习站点构建

学习站点只是次要产物，位于 `site/`：

```bash
cd ~/proj/priv/bagaking/ccstudy/site
bash build-all.sh
```

构建时会把完整 `source/claude-code-source` 同步到 `site/source/claude-code-source`，这样页面里的源码按钮可以直接打开站内 code viewer，在 GitHub Pages 上也能工作。

## 课程地址

- English: https://bagaking.github.io/ccstudy/
- 中文: https://bagaking.github.io/ccstudy/zh/

本地入口仍然是 `site/index.html` 与 `site/zh/index.html`。

## 说明

- `source/claude-code-source` 保留完整源码树。
- 使用入口是这个仓库根 README；
- 课程公开地址见上面的“课程地址”。
