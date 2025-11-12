import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

function _getStoredVoterTokenKey(pollId) {
  return `voter_${pollId}`
}

function _generateVoterTokenFallback() {
  // use crypto.randomUUID if available, otherwise fallback
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch (e) {}
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getOrCreateVoterToken(pollId) {
  const key = _getStoredVoterTokenKey(pollId)
  try {
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const token = _generateVoterTokenFallback()
    localStorage.setItem(key, token)
    return token
  } catch (e) {
    // localStorage may fail in some contexts; still return a token (non-persistent)
    return _generateVoterTokenFallback()
  }
}

export const usePollStore = defineStore('poll', () => {
  const poll = ref(null)
  const votes = ref([])

  async function fetchPollByPublicToken(publicToken) {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('public_token', publicToken)
      .single()

    if (error) throw error
    poll.value = data
    return data
  }

  async function fetchVotes() {
    if (!poll.value) return
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('poll_id', poll.value.id)

    votes.value = data || []
    return votes.value
  }

  function getVoterToken() {
    if (!poll.value) return null
    return getOrCreateVoterToken(poll.value.id)
  }

  async function vote(choice) {
    if (!poll.value) throw new Error('poll not loaded')
    const voter_token = getOrCreateVoterToken(poll.value.id)
    const payload = { poll_id: poll.value.id, voter_token, choice }
    const { data, error } = await supabase
      .from('votes')
      .upsert(payload, { onConflict: ['poll_id', 'voter_token'] })

    // refresh votes after upsert
    await fetchVotes()
    return { data, error }
  }

  return { poll, votes, fetchPollByPublicToken, fetchVotes, getVoterToken, vote }
})
