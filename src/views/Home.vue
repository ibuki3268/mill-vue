<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const roomToken = ref('')
const publicToken = ref('')
const busy = ref(false)
const message = ref('')
const error = ref(null)   // ★ エラーメッセージ用
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
  // ランダム生成時は DB に保存しない
  roomToken.value = 'room-' + genHex(4)
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
    const { error: supaError } = await supabase
      .from('rooms')
      .insert([{ room_token: room, owner_token: owner }])
    if (supaError && !String(supaError.message).toLowerCase().includes('duplicate')) {
      error.value = 'ルーム作成に失敗しました: ' + supaError.message
      console.warn('ensureRoomRecord error', supaError)
    }
  } catch (e) {
    error.value = 'ルーム作成時に例外が発生しました: ' + e.message
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
  const title = window.prompt('Poll のタイトルを入力してください')
  if (!title) return
  const raw = window.prompt('選択肢をカンマ区切りで入力してください（例: はい,いいえ）')
  if (!raw) return
  const choices = raw.split(',').map(s => s.trim()).filter(Boolean)
  if (choices.length === 0) return

  busy.value = true
  message.value = 'Creating poll...'
  error.value = null
  try {
    if (roomToken.value) await ensureRoomRecord(roomToken.value)
    const ptoken = genHex(8)
    const payload = { title, choices, public_token: ptoken, room_token: roomToken.value || null }
    const { data, error: supaError } = await supabase.from('polls').insert([payload]).select('public_token')
    if (supaError) throw supaError
    const got = data && data[0] && data[0].public_token ? data[0].public_token : ptoken
    const link = `${location.origin}/r/${roomToken.value}/p/${got}`
    message.value = '作成しました: ' + got + '\n共有リンクをクリップボードにコピーしました。\n' + link
    await navigator.clipboard.writeText(link).catch(() => {})
    router.push({ name: 'room-poll', params: { room_token: roomToken.value, public_token: got } })
  } catch (e) {
    error.value = 'Poll 作成に失敗しました: ' + (e.message || String(e))
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
  <div class="container">
    <h1 class="title">ようこそ — ルームで投票</h1>
    <p class="subtitle">ルームを作成または指定して Poll を作成・参加できます。</p>

    <!-- ルームトークン入力 -->
    <div class="card">
      <label for="roomToken">ルームトークン</label>
      <small class="description">既存のルームを指定するか、新しくランダム生成できます。</small>
      <div class="row">
        <input id="roomToken" v-model="roomToken" placeholder="例: room-A-123" />
        <button class="btn primary" @click="createRandomRoom">ランダムルームを生成</button>
      </div>
    </div>

    <!-- Poll public_token 入力 -->
    <div class="card">
      <label for="publicToken">Poll の public_token</label>
      <small class="description">既存の Poll がある場合はここに入力してください。</small>
      <div class="row">
        <input id="publicToken" v-model="publicToken" placeholder="例: public-xyz" />
        <button class="btn secondary" @click="goToPublic" :disabled="busy">公開トークンで移動</button>
      </div>
      <p class="hint">またはこのルーム内に新しい Poll を作成します。</p>
      <div class="row">
        <button class="btn primary" @click="goToRoom" :disabled="busy">ルーム内で移動 / 新規作成</button>
        <button class="btn secondary" @click="copyLink">リンクをコピー</button>
      </div>
    </div>

    <div v-if="message" class="message">{{ message }}</div>
  <div v-if="error" class="error">{{ error }}</div> <!-- ★ エラー表示 -->
  </div>
</template>

<style scoped>
.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
  font-family: "Segoe UI", "Helvetica Neue", sans-serif;
  background: #f3f4f6; /* 淡いグレー背景 */
  border-radius: 8px;
  color: #1f2937; /* ダークグレー文字 */
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937; /* 濃いグレー */
  margin-bottom: 8px;
}

.subtitle {
  color: #4b5563;
  margin-bottom: 24px;
}

.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 20px;
  margin-top: 20px;
}

label {
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
  color: #374151;
}

.description {
  font-size: 13px;
  color: #6b7280;
  display: block;
  margin-bottom: 12px;
}

.row {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

input {
  flex: 1;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: #ffffff;
  color: #1f2937;
  transition: border-color 0.2s ease;
}
input:focus {
  border-color: #2563eb; /* 青で強調 */
  outline: none;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

/* メインボタン */
.btn.primary {
  background: #2563eb; /* ブルー */
  color: #fff;
}
.btn.primary:hover {
  background: #1e40af; /* 濃いブルー */
  transform: translateY(-3px); /* 浮き上がり */
  box-shadow: 0 6px 12px rgba(0,0,0,0.25);
}
.btn.primary:active {
  transform: translateY(1px); /* 押したときに沈む */
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* サブボタン */
.btn.secondary {
  background: #e5e7eb; /* グレー */
  color: #374151;
}
.btn.secondary:hover {
  background: #d1d5db;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2);
}
.btn.secondary:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}

.hint {
  font-size: 13px;
  color: #6b7280;
  margin-top: 12px;
}

.message {
  margin-top: 16px;
  color: #2563eb; /* 青で強調 */
  font-weight: 500;
}
.error {
  margin-top: 16px;
  color: #dc2626; /* 赤で強調 */
  font-weight: 500;
}

</style>