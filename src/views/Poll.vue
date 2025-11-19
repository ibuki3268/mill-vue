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
    // ensure we have a voter token for this poll
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

  // If user already voted same choice, nothing to do
  if (currentVote.value && currentVote.value.choice === choice) {
    return
  }

  const ok = window.confirm('投票を確定しますか？（既に投票済みの場合は上書きされます）')
  if (!ok) return

  submitting.value = true
  try {
    previousChoice.value = currentVote.value ? currentVote.value.choice : null
    const { data, error } = await store.vote(choice)
    if (error) throw error

    // Show undo option briefly
    showUndo.value = true
    if (undoTimeout) clearTimeout(undoTimeout)
    undoTimeout = setTimeout(() => { showUndo.value = false; undoTimeout = null }, 8000)

    // update local voter token (store.vote may have created it)
    voterToken.value = store.getVoterToken()

    // navigate to results after a short delay to let user see undo
    setTimeout(() => {
      const routeName = roomToken ? 'room-results' : 'results'
      const params = roomToken ? { room_token: roomToken, public_token: publicToken } : { public_token: publicToken }
      router.push({ name: routeName, params })
    }, 900)
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
    const { data, error } = await store.vote(previousChoice.value)
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
  const routeName = roomToken ? 'room-poll' : 'poll'
  const params = roomToken ? { room_token: roomToken, public_token: publicToken } : { public_token: publicToken }
  const base = location.origin
  const url = roomToken ? `${base}/r/${roomToken}/p/${publicToken}` : `${base}/p/${publicToken}`
  try {
    navigator.clipboard.writeText(url)
    alert('共有リンクをコピーしました: ' + url)
  } catch (e) {
    // fallback: show the url
    prompt('以下のURLをコピーしてください', url)
  }
}
</script>

<template>
  <div style="padding:16px">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="store.poll">
      <h2>{{ store.poll.title }}</h2>
      <div v-if="currentVote">
        あなたの投票: <strong>{{ currentVote.choice }}</strong>
      </div>
      <div v-for="(c, i) in store.poll.choices" :key="i" style="margin:8px 0">
        <button
          @click="onVote(c)"
          :disabled="submitting"
          :style="{ padding: '8px 12px', background: (currentVote && currentVote.choice === c) ? '#e6f7ff' : '#fff' }"
        >
          {{ c }}
        </button>
      </div>
      <div v-if="showUndo" style="margin-top:8px; background:#fff7e6; padding:8px; border:1px solid #ffe4b5">
        投票を変更しました。
        <button @click="undo" :disabled="submitting" style="margin-left:8px">元に戻す</button>
      </div>
        <div style="margin-top:12px">
          <router-link :to="roomToken ? { name: 'room-results', params: { room_token: roomToken, public_token: publicToken } } : { name: 'results', params: { public_token: publicToken } }">結果を見る</router-link>
          <button @click="shareLink" style="margin-left:8px;padding:6px 8px;border-radius:4px;border:1px solid #ddd;background:#fff">共有</button>
        </div>
    </div>
    <div v-else>Poll not found</div>
  </div>
</template>
