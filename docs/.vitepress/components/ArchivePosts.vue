<script setup lang="ts">
import { withBase } from 'vitepress'
import { data as archiveData } from '../data/posts.data'

function formatDate(date: string): string {
  return date || '未注明日期'
}
</script>

<template>
  <div class="archive-page">
    <div class="archive-summary">
      <div class="archive-summary-item">
        <strong>{{ archiveData.stats.postCount }}</strong>
        <span>篇文章</span>
      </div>
      <div class="archive-summary-item">
        <strong>{{ archiveData.stats.categoryCount }}</strong>
        <span>个分类</span>
      </div>
      <div class="archive-summary-item">
        <strong>{{ archiveData.stats.tagCount }}</strong>
        <span>个标签</span>
      </div>
    </div>

    <div class="archive-post-list">
      <article v-for="post in archiveData.posts" :key="post.url" class="archive-post-card">
        <div class="archive-post-meta">
          <span>{{ formatDate(post.date) }}</span>
          <a :href="withBase(`/categories/#${post.categorySlug}`)">{{ post.category }}</a>
        </div>
        <h2 class="archive-post-title">
          <a :href="withBase(post.url)">{{ post.title }}</a>
        </h2>
        <div v-if="post.tags.length" class="archive-chip-list">
          <a
            v-for="tag in post.tags"
            :key="`${post.url}:${tag.slug}`"
            class="archive-chip"
            :href="withBase(`/tags/#${tag.slug}`)"
          >
            #{{ tag.name }}
          </a>
        </div>
      </article>
    </div>
  </div>
</template>
