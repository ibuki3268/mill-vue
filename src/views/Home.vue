<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const roomToken = ref('')
const publicToken = ref('')
const busy = ref(false)
const message = ref('')
const creatorToken = ref('')

function genHex(bytes = 8) {
  try {
    const arr = crypto.getRandomValues(new Uint8Array(bytes))
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (e) {
    // fallback
    return Math.random().toString(16).slice(2, 2 + bytes * 2)
  }
}

async function createRandomRoom() {
  roomToken.value = 'room-' + genHex(4)
  try {
    await ensureRoomRecord(roomToken.value)
  } catch (e) {
    // ignore
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

async function ensureRoomRecord(room) {
  if (!room) return
  const owner = creatorToken.value || getOrCreateCreatorToken()
  try {
    const { error } = await supabase.from('rooms').insert([{ room_token: room, owner_token: owner }])
    if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      console.warn('ensureRoomRecord error', error)
    }
  } catch (e) {
    console.warn('ensureRoomRecord exception', e)
  }
}

onMounted(() => {
  creatorToken.value = getOrCreateCreatorToken()
})

async function goToRoom() {
  if (!roomToken.value) {
    alert('ルームトークンを入力するか「ランダムルームを生成」を押してください')
    return
  }
  if (!publicToken.value) {
    // ask whether to create a new poll in this room
    const create = confirm('public_token が空です。新しい Poll をこのルームで作成しますか？')
    if (!create) return
    await createPollAndEnter()
    return
  }
  router.push({ name: 'room-poll', params: { room_token: roomToken.value, public_token: publicToken.value } })
}

async function createPollAndEnter() {
  // Simple prompt-based poll creation: title and comma-separated choices
  const title = window.prompt('Poll のタイトルを入力してください')
  if (!title) return
  const raw = window.prompt('選択肢をカンマ区切りで入力してください（例: はい,いいえ）')
  if (!raw) return
  const choices = raw.split(',').map(s => s.trim()).filter(Boolean)
  if (choices.length === 0) return

  busy.value = true
  message.value = 'Creating poll...'
  try {
    // make sure room exists so creator can list it later
    if (roomToken.value) await ensureRoomRecord(roomToken.value)
    const ptoken = genHex(8)
    const payload = {
      title,
      choices,
      public_token: ptoken,
      room_token: roomToken.value || null,
    }
    const { data, error } = await supabase.from('polls').insert([payload]).select('public_token')
    if (error) throw error
    const got = data && data[0] && data[0].public_token ? data[0].public_token : ptoken
    const link = `${location.origin}/r/${roomToken.value}/p/${got}`
    message.value = '作成しました: ' + got + '\n共有リンクをクリップボードにコピーしました。' + '\n' + link
    try {
      await navigator.clipboard.writeText(link)
    } catch (e) {
      // ignore clipboard errors, message still contains link
    }
    // navigate to room poll
    router.push({ name: 'room-poll', params: { room_token: roomToken.value, public_token: got } })
  } catch (e) {
    message.value = '作成に失敗しました: ' + (e.message || String(e))
    alert(message.value)
  } finally {
    busy.value = false
  }
}

function goToPublic() {
  if (!publicToken.value) {
    alert('public_token を入力してください')
    return
  }
  router.push({ name: 'poll', params: { public_token: publicToken.value } })
}

async function copyLink() {
  const token = roomToken.value && publicToken.value ? `${location.origin}/r/${roomToken.value}/p/${publicToken.value}` : ''
  if (!token) {
    alert('room と public token の両方が必要です')
    return
  }
  try {
    await navigator.clipboard.writeText(token)
    alert('リンクをコピーしました: ' + token)
  } catch (e) {
    alert('コピーに失敗しました: ' + (e.message || e))
  }
}
</script>

<template>
  <div style="padding:16px; max-width:720px; margin:0 auto">
    <h1>ようこそ — ルームで投票</h1>
    <p>ルームを作成または指定して、そのルーム用の Poll を作成・参加できます。</p>

    <div style="margin-top:12px; padding:12px; border:1px solid #eee; background:#fafafa">
      <label>ルームトークン</label>
      <div style="display:flex; gap:8px; margin-top:8px">
        <input v-model="roomToken" placeholder="room-A-123" style="flex:1; padding:8px" />
        <button @click="createRandomRoom" style="padding:8px">ランダムルームを生成</button>
      </div>
    </div>

    <div style="margin-top:12px; padding:12px; border:1px solid #eee; background:#fff">
      <label>Poll の public_token（既存がある場合）</label>
      <div style="display:flex; gap:8px; margin-top:8px">
        <input v-model="publicToken" placeholder="public token" style="flex:1; padding:8px" />
        <button @click="goToPublic" :disabled="busy" style="padding:8px">公開トークンで移動</button>
      </div>
      <p style="margin-top:8px; color:#666">または下のボタンでこのルーム内に新しい Poll を作成します（title と choices を入力）</p>
      <div style="margin-top:8px">
        <button @click="goToRoom" :disabled="busy" style="padding:8px 12px; background:#3b82f6; color:#fff; border:none; border-radius:4px">ルーム内で移動 / 新規作成</button>
        <button @click="copyLink" style="margin-left:8px; padding:8px 12px">リンクをコピー</button>
      </div>
    </div>

    <div v-if="message" style="margin-top:12px; color:#444">{{ message }}</div>

    <hr style="margin-top:18px" />

    <div style="font-size:13px; color:#666">既存の Poll を直接開く場合は public_token を入力してください。ルームを使う場合は room_token と public_token の両方が必要です。</div>
  </div>
</template>

<style scoped>
label { font-weight:600 }
</style>
