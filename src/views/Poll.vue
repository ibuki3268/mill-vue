<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePollStore } from '../stores/poll'

const route = useRoute()
const router = useRouter()
const store = usePollStore()

const loading = ref(true)
const error = ref(null)

const publicToken = route.params.public_token
const roomToken = route.params.room_token || null

const voterToken = ref(null)
const submitting = ref(false)
const showUndo = ref(false)
const previousChoice = ref(null)
let undoTimeout = null

onMounted(async () => {
  try {
    await store.fetchPollByPublicToken(publicToken, roomToken)
    await store.fetchVotes()
    voterToken.value = store.getVoterToken()
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    loading.value = false
  }
})

const currentVote = computed(() => {
  if (!store.votes || !voterToken.value) return null
  return store.votes.find(v => v && v.voter_token === voterToken.value) || null
})

async function onVote(choice) {
  if (submitting.value) return
  if (currentVote.value && currentVote.value.choice === choice) return

  const ok = window.confirm('投票を確定しますか？（既に投票済みの場合は上書きされます）')
  if (!ok) return

  submitting.value = true
  try {
    previousChoice.value = currentVote.value ? currentVote.value.choice : null
    const { error } = await store.vote(choice)
    if (error) throw error

    showUndo.value = true
    if (undoTimeout) clearTimeout(undoTimeout)
    undoTimeout = setTimeout(() => { showUndo.value = false; undoTimeout = null }, 8000)

    voterToken.value = store.getVoterToken()

  } catch (e) {
    alert('Vote failed: ' + (e.message || e))
  } finally {
    submitting.value = false
  }
}

async function undo() {
  if (!previousChoice.value) return
  submitting.value = true
  try {
    const { error } = await store.vote(previousChoice.value)
    if (error) throw error
    showUndo.value = false
    if (undoTimeout) { clearTimeout(undoTimeout); undoTimeout = null }
  } catch (e) {
    alert('Undo failed: ' + (e.message || e))
  } finally {
    submitting.value = false
  }
}

function shareLink() {
  const base = location.origin
  const url = roomToken ? `${base}/r/${roomToken}/p/${publicToken}` : `${base}/p/${publicToken}`
  try {
    navigator.clipboard.writeText(url)
    alert('共有リンクをコピーしました: ' + url)
  } catch (e) {
    prompt('以下のURLをコピーしてください', url)
  }
}
</script>

<template>
  <div class="poll-card">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="store.poll">
      <h2>{{ store.poll.title }}</h2>
      <div v-if="currentVote">
        あなたの投票: <strong>{{ currentVote.choice }}</strong>
      </div>
      <div v-for="(c, i) in store.poll.choices" :key="i" style="margin:8px 0">
        <button
          class="vote-btn"
          @click="onVote(c)"
          :disabled="submitting"
          :class="{ active: currentVote && currentVote.choice === c }"
        >
          {{ c }}
        </button>
      </div>

      <!-- Undo通知をトースト風に -->
      <transition name="fade">
        <div v-if="showUndo" class="toast">
          投票を変更しました。
          <button @click="undo" :disabled="submitting" class="undo-btn">元に戻す</button>
        </div>
      </transition>

      <div style="margin-top:12px">
        <router-link :to="roomToken ? { name: 'room-results', params: { room_token: roomToken, public_token: publicToken } } : { name: 'results', params: { public_token: publicToken } }">結果を見る</router-link>
        <button @click="shareLink" class="share-btn">共有</button>
      </div>
    </div>
    <div v-else>Poll not found</div>
  </div>
</template>

<style scoped>
.poll-card {
  max-width: 500px;
  margin: 40px auto;
  padding: 28px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}

.poll-card h2 {
  text-align: center;
  font-weight: 700;
  margin-bottom: 24px;
  color: #0f172a;
}

/* 投票ボタン */
.vote-btn {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #f9fafb;
  color: #0f172a;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.vote-btn:hover {
  background: #eaeaea;
}
.vote-btn.active {
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
  color: #fff;
  font-weight: 600;
  border: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

/* ガラス風トースト通知 */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  backdrop-filter: blur(10px);
  background: rgba(255,255,255,0.7);
  border-radius: 12px;
  padding: 14px 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-weight: 500;
}
.undo-btn {
  margin-left: 12px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: #fff;
  cursor: pointer;
}
.undo-btn:hover {
  background: #2563eb;
}
</style>