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
  <div style="padding:16px">
    <div v-if="loading">Loading...</div>
    <div v-else-if="store.poll">
      <h2>Results for: {{ store.poll.title }}</h2>
      <ul>
        <li v-for="(count, choice) in counts" :key="choice">
          {{ choice }}: {{ count }} ({{ total ? Math.round((count/total)*100) : 0 }}%)
        </li>
      </ul>
      <p>Total votes: {{ total }}</p>
      <div style="margin-top:12px">
        <router-link :to="roomToken ? { name: 'room-poll', params: { room_token: roomToken, public_token: publicToken } } : { name: 'poll', params: { public_token: publicToken } }">投票に戻る</router-link>
      </div>
    </div>
    <div v-else>Poll not found</div>
  </div>
</template>
