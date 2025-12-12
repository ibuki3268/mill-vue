<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePollStore } from '../stores/poll'

const route = useRoute()
const store = usePollStore()
const loading = ref(true)
const publicToken = route.params.public_token
const roomToken = route.params.room_token || null

onMounted(async () => {
  try {
    await store.fetchPollByPublicToken(publicToken, roomToken)
    await store.fetchVotes()
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
})

const counts = computed(() => {
  const result = {}
  if (!store.poll) return result
  for (const choice of store.poll.choices) result[choice] = 0
  for (const v of store.votes) {
    if (v && v.choice in result) result[v.choice]++
  }
  return result
})

const total = computed(() => Object.values(counts.value).reduce((a, b) => a + b, 0))
</script>

<template>
  <!-- 横幅制限 + 中央寄せ -->
  <div style="padding:20px; max-width:750px; margin:0 auto">
    <div v-if="loading">Loading...</div>
    <div v-else-if="store.poll">
      <h2>Results for: {{ store.poll.title }}</h2>

      <div style="display:grid; gap:16px">
        <div
          v-for="(count, choice) in counts"
          :key="choice"
          style="border:1px solid #ddd; border-radius:8px; padding:12px; background:#fafafa"
        >
          <h3 style="margin:0 0 8px">{{ choice }}</h3>

          <!-- バー表示 -->
          <div style="background:#eee; border-radius:4px; overflow:hidden; height:20px">
            <div
              :style="{
                width: total ? Math.round((count/total)*100) + '%' : '0%',
                background: '#42b983',
                height: '100%',
                transition: 'width 0.3s ease'
              }"
            ></div>
          </div>

          <p style="margin:6px 0 0; font-size:14px; color:#555">
            {{ count }}票 ({{ total ? Math.round((count/total)*100) : 0 }}%)
          </p>
        </div>
      </div>

      <p style="margin-top:16px; font-weight:bold">Total votes: {{ total }}</p>

      <div style="margin-top:12px">
        <router-link
          :to="roomToken
            ? { name: 'room-poll', params: { room_token: roomToken, public_token: publicToken } }
            : { name: 'poll', params: { public_token: publicToken } }"
        >
          投票に戻る
        </router-link>
      </div>
    </div>
    <div v-else>Poll not found</div>
  </div>
</template>