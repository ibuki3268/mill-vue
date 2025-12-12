<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const creating = ref(false)
const error = ref(null)

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

async function ensureRoomRecord(room) {
  if (!room) return
  const owner = getOrCreateCreatorToken()
  try {
    const { error: supaError } = await supabase
      .from('rooms')
      .insert([{ room_token: room, owner_token: owner }])
    if (supaError && !String(supaError.message).toLowerCase().includes('duplicate')) {
      console.warn('ensureRoomRecord error', supaError)
    }
  } catch (e) {
    console.warn('ensureRoomRecord exception', e)
  }
}

async function createAirConditionPoll() {
  creating.value = true
  error.value = null
  
  try {
    // Generate room and poll tokens
    const roomToken = 'room-' + genHex(4)
    const publicToken = genHex(8)
    
    // Ensure room exists
    await ensureRoomRecord(roomToken)
    
    // Create poll with predefined data
    const payload = {
      title: '冷房の温度感',
      choices: ['暑い', 'ちょうどよい', '寒い'],
      public_token: publicToken,
      room_token: roomToken
    }
    
    const { error: supaError } = await supabase.from('polls').insert([payload])
    if (supaError) throw supaError
    
    // Copy share link
    const link = `${location.origin}/r/${roomToken}/p/${publicToken}`
    try {
      await navigator.clipboard.writeText(link)
    } catch (e) {
      // ignore clipboard errors
    }
    
    // Navigate to the created poll
    router.push({ name: 'room-poll', params: { room_token: roomToken, public_token: publicToken } })
  } catch (e) {
    error.value = '投票ルームの作成に失敗しました: ' + (e.message || String(e))
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="airscene-wrap">
    <h1 class="title">Airscene の投票</h1>
    <p class="subtitle">冷房の温度感に関する投票ルームを作成します</p>
    
    <div class="poll-preview">
      <h3>投票内容</h3>
      <p><strong>タイトル:</strong> 冷房の温度感</p>
      <p><strong>選択肢:</strong></p>
      <ul>
        <li>暑い</li>
        <li>ちょうどよい</li>
        <li>寒い</li>
      </ul>
    </div>
    
    <button 
      class="btn primary large" 
      @click="createAirConditionPoll"
      :disabled="creating"
    >
      {{ creating ? '作成中...' : '投票ルームを作成する' }}
    </button>
    
    <div v-if="error" class="error">{{ error }}</div>
    
    <p class="note">※ ボタンを押すと自動でグループIDと投票が作成され、共有リンクがコピーされます</p>
  </div>
</template>

<style scoped>
.airscene-wrap {
  max-width: 640px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}

.title {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #0f172a;
}

.subtitle {
  color: #64748b;
  margin: 0 0 24px;
}

.poll-preview {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.poll-preview h3 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #334155;
}

.poll-preview p {
  margin: 8px 0;
  color: #475569;
}

.poll-preview ul {
  margin: 8px 0;
  padding-left: 24px;
}

.poll-preview li {
  margin: 4px 0;
  color: #475569;
}

.btn {
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn.primary {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.btn.primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.large {
  width: 100%;
  padding: 14px 24px;
  font-size: 18px;
}

.error {
  margin-top: 16px;
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  color: #c33;
}

.note {
  margin-top: 16px;
  font-size: 13px;
  color: #64748b;
  text-align: center;
}
</style>
