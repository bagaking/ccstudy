# ccstudy

`ccstudy` 是一个面向学习、阅读与本地复现的独立仓库。

## Status and provenance

- This is an independent study/reproduction repository. It is not an official
  Claude Code, Anthropic, or upstream project.
- `source/claude-code-source` is kept here as a source snapshot for local
  analysis and reproducible study. This repository does not claim ownership of,
  publish, or redistribute an upstream product release.
- The bilingual site under `site/` is learning material built from this
  repository. It is documentation and source-reading support, not an official
  product site.
- Build and run commands below are intended for local learning and verification
  of the included source snapshot. They are not a supported distribution path
  for an upstream CLI.

## 目录

```text
ccstudy/
  source/
    claude-code-source/      # source snapshot for local study
  site/
    ...                      # learning site and GitHub Pages build source
```

## 如何构建源码

The commands in this section keep the original local reproduction flow intact.
They build the checked-in `source/claude-code-source` snapshot for local
inspection and smoke testing only.

### 1. 环境依赖

- Bun `1.3.x`
- pnpm `10+`
- Node.js `18+`

### 2. 安装依赖

```bash
cd source/claude-code-source
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

如果你只是想在本地启动已构建的快照进行学习验证：

```bash
bun dist/cli.js
```

## 学习站点构建

学习站点位于 `site/`，用于浏览课程内容和站内源码引用：

```bash
cd site
bash build-all.sh
```

构建时会把 `source/claude-code-source` 快照同步到
`site/source/claude-code-source`，这样页面里的源码按钮可以打开站内 code
viewer，在 GitHub Pages 上也能工作。这个同步副本属于学习站点资产，不是单独
发布的上游产品包。

## 课程地址

- English: https://bagaking.github.io/ccstudy/
- 中文: https://bagaking.github.io/ccstudy/zh/

本地入口仍然是 `site/index.html` 与 `site/zh/index.html`。

## 说明

- `source/claude-code-source` 保留用于学习复现的源码快照。
- 使用入口是这个仓库根 README；
- 课程公开地址见上面的“课程地址”。
