import { mkdir, access, writeFile } from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()

const pages = [
  {
    file: path.join(rootDir, 'docs/posts/index.md'),
    content: `---
title: 文章归档
---

<ArchivePosts />
`
  },
  {
    file: path.join(rootDir, 'docs/categories/index.md'),
    content: `---
title: 分类
---

<ArchiveTaxonomy type="categories" />
`
  },
  {
    file: path.join(rootDir, 'docs/tags/index.md'),
    content: `---
title: 标签
---

<ArchiveTaxonomy type="tags" />
`
  }
]

for (const page of pages) {
  await mkdir(path.dirname(page.file), { recursive: true })

  try {
    await access(page.file)
  } catch {
    await writeFile(page.file, page.content, 'utf8')
  }
}
