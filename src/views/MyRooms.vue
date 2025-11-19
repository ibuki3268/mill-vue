<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const rooms = ref([])
const loading = ref(true)
const creatorToken = ref('')

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
    const { data, error } = await supabase.from('rooms').select('*').eq('owner_token', owner).order('created_at', { ascending: false })
    if (error) throw error
    rooms.value = data || []
    // for convenience, load polls for each room
    for (const r of rooms.value) {
      const { data: polls } = await supabase.from('polls').select('id,title,public_token,created_at').eq('room_token', r.room_token).order('created_at', { ascending: false })
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
</script>

<template>
  <div style="padding:16px; max-width:900px; margin:0 auto">
    <h2>作成したルーム一覧（このブラウザのみ表示）</h2>
    <div v-if="loading">読み込み中...</div>
    <div v-else>
      <div v-if="rooms.length === 0">作成したルームが見つかりません。</div>
      <div v-for="r in rooms" :key="r.room_token" style="margin-top:12px; padding:12px; border:1px solid #eee; background:#fff">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <div>
            <strong>{{ r.room_token }}</strong>
            <div style="font-size:12px; color:#666">作成: {{ r.created_at }}</div>
          </div>
          <div>
            <button @click="navigator.clipboard && navigator.clipboard.writeText(location.origin + '/r/' + r.room_token + '/p/')" style="padding:6px 8px">リンクをコピー</button>
          </div>
        </div>
        <div v-if="r.polls && r.polls.length" style="margin-top:8px">
          <div v-for="p in r.polls" :key="p.public_token" style="padding:6px 0; border-top:1px dashed #f0f0f0">
            <a href="#" @click.prevent="openPoll(r.room_token, p.public_token)">{{ p.title }}</a>
            <div style="font-size:12px; color:#666">{{ p.public_token }} — {{ p.created_at }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
a { color: #3b82f6 }
</style>
