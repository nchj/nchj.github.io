import { createContentLoader } from 'vitepress'
import type { ArchiveData } from '../utils/content.mts'
import { collectArchiveData } from '../utils/content.mts'

export default createContentLoader<ArchiveData>('posts/**/*.md', {
  transform() {
    return collectArchiveData(process.cwd())
  }
})
