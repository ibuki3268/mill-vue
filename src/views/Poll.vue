<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePollStore } from '../stores/poll'

const route = useRoute()
const router = useRouter()
const store = usePollStore()

const loading = ref(true)
const error = ref(null)

const publicToken = route.params.public_token

onMounted(async () => {
  try {
    await store.fetchPollByPublicToken(publicToken)
    await store.fetchVotes()
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    loading.value = false
  }
})

async function onVote(choice) {
  try {
    await store.vote(choice)
    // show results after voting
    router.push({ name: 'results', params: { public_token: publicToken } })
  } catch (e) {
    alert('Vote failed: ' + (e.message || e))
  }
}
</script>

<template>
  <div style="padding:16px">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="store.poll">
      <h2>{{ store.poll.title }}</h2>
      <div v-for="(c, i) in store.poll.choices" :key="i" style="margin:8px 0">
        <button @click="onVote(c)">{{ c }}</button>
      </div>
      <div style="margin-top:12px">
        <router-link :to="{ name: 'results', params: { public_token: publicToken } }">結果を見る</router-link>
      </div>
    </div>
    <div v-else>Poll not found</div>
  </div>
</template>
