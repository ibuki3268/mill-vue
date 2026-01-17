<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'

const router = useRouter()
const rooms = ref([])
const loading = ref(true)
const creatorToken = ref('')
const copyMessage = ref('')
const showMessage = ref(false)
const showQRModal = ref(false)
const currentQRDataURL = ref('')
const currentQRTitle = ref('')

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

async function showQR(roomToken, publicToken, title) {
  try {
    const link = location.origin + '/r/' + roomToken + '/p/' + publicToken
    const dataURL = await QRCode.toDataURL(link, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    currentQRDataURL.value = dataURL
    currentQRTitle.value = title
    showQRModal.value = true
  } catch (e) {
    console.error('QR生成エラー', e)
  }
}

function closeQRModal() {
  showQRModal.value = false
  currentQRDataURL.value = ''
  currentQRTitle.value = ''
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
          <button @click="showQR(r.room_token, r.polls[0]?.public_token, r.polls[0]?.title)" class="qr-btn">QRコード表示</button>
        </div>

        <!-- その他のPoll一覧（2件目以降） -->
        <div v-if="r.polls && r.polls.length > 1" class="poll-list">
          <div v-for="p in r.polls.slice(1)" :key="p.public_token" class="poll-item">
            <a href="#" @click.prevent="openPoll(r.room_token, p.public_token)">
              {{ p.title }}
            </a>
            <span class="poll-badge">{{ p.public_token }}</span>
            <span class="poll-date">{{ formatDate(p.created_at) }}</span>
            <button @click="showQR(r.room_token, p.public_token, p.title)" class="mini-qr-btn">QR</button>
          </div>
        </div>
      </div>
    </div>

    <!-- QRコードモーダル -->
    <div v-if="showQRModal" class="modal-overlay" @click="closeQRModal">
      <div class="modal-content" @click.stop>
        <h3>{{ currentQRTitle }}</h3>
        <img :src="currentQRDataURL" alt="QRコード" class="qr-image" />
        <p class="qr-instruction">このQRコードを読み取って投票ページへアクセスできます</p>
        <button @click="closeQRModal" class="close-btn">閉じる</button>
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

.qr-btn {
  background: #3b82f6 !important;
  margin-left: 8px;
}
.qr-btn:hover {
  background: #2563eb !important;
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

.mini-qr-btn {
  padding: 2px 8px;
  font-size: 11px;
  border: none;
  background: #3b82f6;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  margin-left: auto;
}
.mini-qr-btn:hover {
  background: #2563eb;
}

/* QRモーダル */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.modal-content h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
}
.qr-image {
  width: 300px;
  height: 300px;
  margin: 0 auto;
  display: block;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
}
.qr-instruction {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}
.close-btn {
  margin-top: 20px;
  padding: 10px 24px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
}
.close-btn:hover {
  background: #2563eb;
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