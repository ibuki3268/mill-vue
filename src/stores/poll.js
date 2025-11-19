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

  // If roomToken is provided, filter polls by it as well.
  async function fetchPollByPublicToken(publicToken, roomToken = null) {
    let q = supabase.from('polls').select('*')
    q = q.eq('public_token', publicToken)
    if (roomToken) q = q.eq('room_token', roomToken)

    const { data, error } = await q.single()
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
  // include room_token if this poll is room-scoped
  if (poll.value && poll.value.room_token) payload.room_token = poll.value.room_token
    // Try upsert using a conflict target that matches the DB index.
    // Some supabase/postgres setups expect a comma-separated string for onConflict.
    let data = null
    let error = null
    try {
      const res = await supabase
        .from('votes')
        // pass as array to be safe and use comma-separated onConflict
        .upsert([payload], { onConflict: 'poll_id, voter_token' })
      data = res.data
      error = res.error
    } catch (err) {
      // unexpected client-side error
      error = err
    }

    // If upsert failed (e.g. client/server mismatch), do a safe existence-check then update/insert.
    if (error) {
      const msg = (error && error.message) ? error.message : String(error)
      if (msg.includes('no unique or exclusion constraint') || msg.includes('ON CONFLICT') || msg.includes('duplicate key')) {
        try {
          // check if a vote already exists for this poll_id + voter_token
          const { data: existing, error: selErr } = await supabase
            .from('votes')
            .select('id, choice')
            .eq('poll_id', poll.value.id)
            .eq('voter_token', voter_token)
            .limit(1)

          if (selErr) {
            error = selErr
          } else if (existing && existing.length > 0) {
            // update the existing row (safe fallback)
            const id = existing[0].id
            const upd = await supabase
              .from('votes')
              .update({ choice, updated_at: new Date().toISOString() })
              .eq('id', id)
            data = upd.data
            error = upd.error
          } else {
            // no existing row -> insert
            const ins = await supabase.from('votes').insert([payload])
            data = ins.data
            error = ins.error
          }
        } catch (e) {
          error = e
        }
      }
    }

    // refresh votes after upsert/insert
    await fetchVotes()
    return { data, error }
  }

  return { poll, votes, fetchPollByPublicToken, fetchVotes, getVoterToken, vote }
})
