<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToRoom() {
  // ask for room token and public token
  const room = window.prompt('ルームトークンを入力してください（例: room-A-123）')
  if (!room) return
  const publicToken = window.prompt('移動するPollの public_token を入力してください（例: 3f33d002b304e669）')
  if (!publicToken) return
  router.push({ name: 'room-poll', params: { room_token: room, public_token: publicToken } })
}
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
  |
  <button @click="goToRoom" style="background:#3b82f6;color:#fff;border:none;padding:6px 10px;border-radius:4px;margin-left:8px;cursor:pointer">ルームに飛ぶ</button>
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
