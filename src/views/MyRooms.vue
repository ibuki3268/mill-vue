<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const rooms = ref([])
const loading = ref(true)
const creatorToken = ref('')
const copyMessage = ref('')
const showMessage = ref(false)

function copyLink(roomToken, publicToken) {
  const link = location.origin + '/r/' + roomToken + '/p/' + publicToken
  navigator.clipboard?.writeText(link).then(() => {
    copyMessage.value = 'リンクをコピーしました！'
    showMessage.value = true
    setTimeout(() => {
      showMessage.value = false
    }, 2000) // 2秒後に消える
  })
}

function genHex(bytes = 8) {
  try {
    const arr = crypto.getRandomValues(new Uint8Array(bytes))
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (e) {
    return Math.random().toString(16).slice(2, 2 + bytes * 2)
  }
}

function getOrCreateCreatorToken() {
  try {
    const key = 'creator_token'
    let t = localStorage.getItem(key)
    if (t) return t
    t = genHex(12)
    localStorage.setItem(key, t)
    return t
  } catch (e) {
    return genHex(12)
  }
}

async function loadRooms() {
  loading.value = true
  try {
    const owner = creatorToken.value || getOrCreateCreatorToken()
    const { data, error } = await supabase.from('rooms')
      .select('*')
      .eq('owner_token', owner)
      .order('created_at', { ascending: false })
    if (error) throw error
    rooms.value = data || []
    for (const r of rooms.value) {
      const { data: polls } = await supabase.from('polls')
        .select('id,title,public_token,created_at')
        .eq('room_token', r.room_token)
        .order('created_at', { ascending: false })
      r.polls = polls || []
    }
  } catch (e) {
    console.error('loadRooms failed', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  creatorToken.value = getOrCreateCreatorToken()
  loadRooms()
})

function openPoll(roomToken, publicToken) {
  router.push({ name: 'room-poll', params: { room_token: roomToken, public_token: publicToken } })
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="container">
    <h2>作成したグループ一覧（このブラウザのみ表示）</h2>
    <div v-if="loading">読み込み中...</div>
    <div v-else>
      <div v-if="rooms.length === 0">作成したグループが見つかりません。</div>
      <div v-for="r in rooms" :key="r.room_token" class="room-card">
        <!-- Pollタイトルをカードの見出しに -->
        <div class="room-header" v-if="r.polls && r.polls.length">
          <a href="#" @click.prevent="openPoll(r.room_token, r.polls[0].public_token)" class="poll-title">
            {{ r.polls[0].title }}
          </a>
          <span class="poll-date">{{ formatDate(r.polls[0].created_at) }}</span>
        </div>

        <!-- 区切り線 -->
        <hr class="divider" />

        <!-- グループIDは補助情報 -->
        <div class="room-meta">
          <span class="room-token">グループID: {{ r.room_token }}</span>
        </div>

        <!-- リンクコピー -->
        <div class="room-actions">
          <button @click="copyLink(r.room_token, r.polls[0]?.public_token)">リンクをコピー</button>
        </div>

        <!-- その他のPoll一覧（2件目以降） -->
        <div v-if="r.polls && r.polls.length > 1" class="poll-list">
          <div v-for="p in r.polls.slice(1)" :key="p.public_token" class="poll-item">
            <a href="#" @click.prevent="openPoll(r.room_token, p.public_token)">
              {{ p.title }}
            </a>
            <span class="poll-badge">{{ p.public_token }}</span>
            <span class="poll-date">{{ formatDate(p.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ 右下通知はカード外に置く -->
    <div v-if="showMessage" class="toast">
      {{ copyMessage }}
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.room-card {
  margin-top: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.poll-title {
  font-size: 20px;
  font-weight: bold;
  color: #3c7fdeff;
  text-decoration: none;
}
.poll-title:hover {
  text-decoration: underline;
}

.divider {
  border: none;
  border-top: 2px solid #e5e7eb; /* 薄いグレーの線 */
  margin: 12px 0;
}

.room-meta {
  margin-top: 4px;
}
.room-token {
  font-size: 13px;
  color: #666;
}
.room-date {
  font-size: 12px;
  color: #888;
}

.room-actions {
  margin-top: 8px;
}
.room-actions button {
  padding: 6px 10px;
  border: none;
  background: #71c481ff;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.room-actions button:hover {
  background: #059669;
}

.poll-list {
  margin-top: 12px;
}
.poll-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-top: 1px dashed #f0f0f0;
}
.poll-item a {
  color: #3b82f6;
  text-decoration: none;
}
.poll-item a:hover {
  text-decoration: underline;
}
.poll-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}
.poll-date {
  font-size: 11px;
  color: #666;
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #333;
  color: #fff;
  padding: 10px 16px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  font-size: 14px;
  animation: fadeInOut 2s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translateY(10px); }
}
</style>