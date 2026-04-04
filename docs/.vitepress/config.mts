import { defineConfig } from 'vitepress'
import { createPostsSidebar } from './utils/content.mts'

const nav = [
  {
    "text": "首页",
    "link": "/"
  },
  {
    "text": "文章",
    "link": "/posts/"
  },
  {
    "text": "分类",
    "link": "/categories/"
  },
  {
    "text": "标签",
    "link": "/tags/"
  },
  {
    "text": "关于",
    "link": "/about"
  }
]
const sidebar = {
  '/posts/': createPostsSidebar(process.cwd())
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'NCHJ 的笔记',
  description: '技术笔记与工程实践整理',
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    nav,
    sidebar,
    socialLinks: [{ icon: 'github', link: 'https://github.com/nchj/nchj.github.io' }],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: '目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新于' },
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
