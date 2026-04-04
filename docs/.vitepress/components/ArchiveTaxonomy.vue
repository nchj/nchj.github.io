<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as archiveData } from '../data/posts.data'

const props = defineProps<{
  type: 'categories' | 'tags'
}>()

const groups = computed(() =>
  props.type === 'categories' ? archiveData.categories : archiveData.tags
)

const title = computed(() => (props.type === 'categories' ? '分类' : '标签'))

function formatDate(date: string): string {
  return date || '未注明日期'
}
</script>

<template>
  <div class="archive-page">
    <p class="archive-intro">
      当前共整理出 <strong>{{ groups.length }}</strong> 个{{ title }}。
    </p>

    <div class="archive-chip-list archive-chip-list-large">
      <a
        v-for="group in groups"
        :key="group.slug"
        class="archive-chip"
        :href="withBase(`/${props.type}/#${group.slug}`)"
      >
        {{ group.name }} ({{ group.count }})
      </a>
    </div>

    <section
      v-for="group in groups"
      :id="group.slug"
      :key="group.slug"
      class="archive-group"
    >
      <h2 class="archive-group-title">{{ group.name }} <span>({{ group.count }})</span></h2>
      <ul class="archive-group-list">
        <li v-for="post in group.posts" :key="`${group.slug}:${post.url}`" class="archive-group-item">
          <a :href="withBase(post.url)">{{ post.title }}</a>
          <span class="archive-group-meta">{{ formatDate(post.date) }}</span>
          <template v-if="props.type === 'tags'">
            <a class="archive-group-meta-link" :href="withBase(`/categories/#${post.categorySlug}`)">
              {{ post.category }}
            </a>
          </template>
          <template v-else-if="post.tags.length">
            <span class="archive-group-meta">
              {{ post.tags.map((tag) => `#${tag.name}`).join(' ') }}
            </span>
          </template>
        </li>
      </ul>
    </section>
  </div>
</template>
