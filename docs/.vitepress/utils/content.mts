import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export interface PostTag {
  name: string
  slug: string
}

export interface PostItem {
  title: string
  url: string
  date: string
  timestamp: number
  category: string
  categorySlug: string
  tags: PostTag[]
}

export interface TaxonomyGroup {
  name: string
  slug: string
  count: number
  posts: PostItem[]
}

export interface ArchiveData {
  posts: PostItem[]
  categories: TaxonomyGroup[]
  tags: TaxonomyGroup[]
  stats: {
    postCount: number
    categoryCount: number
    tagCount: number
  }
}

const ARTICLE_INDEX_MIN_LENGTH = 200

function normalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function stripFrontmatter(src: string): string {
  return src.replace(/^---[\s\S]*?---\s*/u, '').trim()
}

function normalizeDate(value: unknown): { text: string; timestamp: number } {
  if (typeof value !== 'string' || value.trim() === '') {
    return { text: '', timestamp: 0 }
  }

  const text = value.trim()
  const timestamp = Number.isNaN(Date.parse(text)) ? 0 : Date.parse(text)
  return { text, timestamp }
}

function normalizeTagNames(rawTags: unknown): string[] {
  if (Array.isArray(rawTags)) {
    return rawTags
      .filter((tag): tag is string => typeof tag === 'string')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  if (typeof rawTags === 'string' && rawTags.trim() !== '') {
    return [rawTags.trim()]
  }

  return []
}

function shouldPreferDisplayName(current: string, next: string): boolean {
  return current === current.toLowerCase() && next !== next.toLowerCase()
}

function isArchivePost(url: string, src: string, frontmatter: Record<string, unknown>): boolean {
  const title = typeof frontmatter.title === 'string' ? frontmatter.title.trim() : ''
  if (!title) return false

  if (frontmatter.article === false) return false

  if (!url.endsWith('/')) return true
  if (frontmatter.article === true) return true

  const content = stripFrontmatter(src)
  return content.length >= ARTICLE_INDEX_MIN_LENGTH
}

function walkMarkdownFiles(dir: string): string[] {
  const result: string[] = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...walkMarkdownFiles(fullPath))
      continue
    }

    if (entry.isFile() && fullPath.endsWith('.md')) {
      result.push(fullPath)
    }
  }

  return result
}

function toPostUrl(srcDir: string, file: string): string {
  return (
    '/' +
    path
      .relative(srcDir, file)
      .split(path.sep)
      .join('/')
      .replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, '')
  )
}

export function collectArchiveData(rootDir: string): ArchiveData {
  const srcDir = path.join(rootDir, 'docs')
  const postsDir = path.join(srcDir, 'posts')
  const files = walkMarkdownFiles(postsDir).sort()

  const posts: PostItem[] = []
  const categoryMap = new Map<string, { name: string; slug: string; posts: PostItem[] }>()
  const tagMap = new Map<string, { name: string; slug: string; posts: PostItem[] }>()

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8')
    const { data: frontmatter } = matter(src)
    const url = toPostUrl(srcDir, file)

    if (!isArchivePost(url, src, frontmatter)) continue

    const title = String(frontmatter.title).trim()
    const categoryName =
      typeof frontmatter.category === 'string' && frontmatter.category.trim() !== ''
        ? frontmatter.category.trim()
        : '未分类'
    const { text: date, timestamp } = normalizeDate(frontmatter.date)
    const categoryKey = normalizeKey(categoryName)
    const categorySlug = toSlug(categoryName)

    const tagNames = normalizeTagNames(frontmatter.tags)
    const seenTagKeys = new Set<string>()
    const tags = tagNames.flatMap((tagName) => {
      const tagKey = normalizeKey(tagName)
      if (seenTagKeys.has(tagKey)) return []
      seenTagKeys.add(tagKey)
      return [{ name: tagName, slug: toSlug(tagName) }]
    })

    const post: PostItem = {
      title,
      url,
      date,
      timestamp,
      category: categoryName,
      categorySlug,
      tags
    }

    posts.push(post)

    const currentCategory = categoryMap.get(categoryKey)
    if (currentCategory) {
      currentCategory.posts.push(post)
    } else {
      categoryMap.set(categoryKey, { name: categoryName, slug: categorySlug, posts: [post] })
    }

    for (const tag of tags) {
      const tagKey = normalizeKey(tag.name)
      const currentTag = tagMap.get(tagKey)
      if (currentTag) {
        currentTag.posts.push(post)
        if (shouldPreferDisplayName(currentTag.name, tag.name)) {
          currentTag.name = tag.name
        }
      } else {
        tagMap.set(tagKey, { name: tag.name, slug: tag.slug, posts: [post] })
      }
    }
  }

  posts.sort((a, b) => b.timestamp - a.timestamp || a.title.localeCompare(b.title, 'zh-CN'))

  const toGroups = (
    map: Map<string, { name: string; slug: string; posts: PostItem[] }>
  ): TaxonomyGroup[] =>
    [...map.values()]
      .map((group) => ({
        name: group.name,
        slug: group.slug,
        count: group.posts.length,
        posts: [...group.posts].sort(
          (a, b) => b.timestamp - a.timestamp || a.title.localeCompare(b.title, 'zh-CN')
        )
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))

  const categories = toGroups(categoryMap)
  const tags = toGroups(tagMap)

  return {
    posts,
    categories,
    tags,
    stats: {
      postCount: posts.length,
      categoryCount: categories.length,
      tagCount: tags.length
    }
  }
}

export function createPostsSidebar(rootDir: string) {
  const archive = collectArchiveData(rootDir)

  return archive.categories.map((category) => ({
    text: category.name,
    collapsed: false,
    items: category.posts.map((post) => ({
      text: post.title,
      link: post.url
    }))
  }))
}
