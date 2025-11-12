<script setup>
</script>

<template>
  <div>
    <nav style="padding:12px; border-bottom:1px solid #eee">
      <router-link to="/">Home</router-link>
      |
      <!-- example poll token inserted here for convenience -->
      <router-link :to="{ name: 'poll', params: { public_token: '3f33d002b304e669' } }">サンプル投票</router-link>
      |
      <router-link :to="{ name: 'results', params: { public_token: '3f33d002b304e669' } }">サンプル結果</router-link>
    </nav>

    <main style="padding:16px">
      <router-view />
    </main>

    <footer style="padding:12px; border-top:1px solid #eee; font-size:12px; color:#666">
      mill-vue — 公開リンク + cookie 方式の投票デモ
    </footer>
  </div>
</template>

<style scoped>
a { color: #3b82f6; text-decoration: none }
a:hover { text-decoration: underline }
</style>
