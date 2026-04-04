import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ArchivePosts from '../components/ArchivePosts.vue'
import ArchiveTaxonomy from '../components/ArchiveTaxonomy.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ArchivePosts', ArchivePosts)
    app.component('ArchiveTaxonomy', ArchiveTaxonomy)
  }
} satisfies Theme
