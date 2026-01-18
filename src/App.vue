<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToRoom() {
  // ask for room token and public token
  const room = window.prompt('グループIDを入力してください（例: room-A-123）')
  if (!room) return
  const publicToken = window.prompt('投票IDを入力してください（例: 3f33d002b304e669）')
  if (!publicToken) return
  router.push({ name: 'room-poll', params: { room_token: room, public_token: publicToken } })
}
</script>

<template>
  <div>
    <nav class="navbar">
      <router-link :to="{ name: 'home' }" class="nav-btn"> ホーム</router-link>
      <router-link :to="{ name: 'start' }" class="nav-btn"> スタート</router-link>
      <router-link :to="{ name: 'poll', params: { public_token: '3f33d002b304e669' } }" class="nav-btn"> サンプル投票</router-link>
      <router-link :to="{ name: 'results', params: { public_token: '3f33d002b304e669' } }" class="nav-btn"> サンプル結果</router-link>
      <router-link :to="{ name: 'my-rooms' }" class="nav-btn"> 作成したグループ</router-link>
      <button @click="goToRoom" class="nav-btn primary"> グループに参加</button>
    </nav>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      Airscene — 公開リンク + cookie 方式の投票デモ
    </footer>
  </div>
</template>

<style scoped>
.navbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}
.nav-btn {
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: 600;
  color: #374151;
  text-decoration: none;
  transition: background 0.2s, transform 0.2s;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  font-size: 14px;
}
.nav-btn:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}
.nav-btn.primary {
  background: #3b82f6;
  color: #fff;
}
.nav-btn.primary:hover {
  background: #2563eb;
}

/* スマホ対応 */
@media (max-width: 768px) {
  .navbar {
    gap: 6px;
    padding: 8px;
  }
  .nav-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
}

.footer {
  padding: 12px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #666;
  text-align: center;
}

/* ★ 追加: 現在開いているページのリンクを色付きにする */
.router-link-exact-active {
  background: #49abf1ff;
  color: #fff !important;
  border-radius: 6px;
}
</style>
