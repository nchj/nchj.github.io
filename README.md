# 开发说明

## 项目结构

- `docs/`：VitePress 站点根目录
- `docs/.vitepress/config.mts`：站点配置
- `docs/posts/`：文章内容

## 本地预览

```bash
npm install
npm run docs:dev
```

## 构建

```bash
npm run docs:build
```

## 写作约定

- 文章放到 `docs/posts/` 的对应主题目录下
- 图片目录与 Markdown 文件同级，且目录名与 Markdown 文件名一致
- 例如 `redis常见面试题.md` 对应 `redis常见面试题/`
- Frontmatter 保留 `title`、`date`、`category`、`tags`

## 部署

GitHub Actions 会在推送到 `main` 后自动执行 VitePress 构建并部署到 GitHub Pages。
