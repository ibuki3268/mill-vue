<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

function goAirscene() {
  router.push({ name: 'airscene' })
}

function goOtherPoll() {
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="container">
    <h1 class="title">Airscene へようこそ</h1>
    <p class="subtitle">投票の種類を選んでください</p>
    
    <div class="card">
      <div class="btns">
        <button class="btn primary" @click="goAirscene">Airscene の投票へ</button>
        <button class="btn secondary" @click="goOtherPoll">その他の投票へ</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
  font-family: "Segoe UI", "Helvetica Neue", sans-serif;
  background: #f3f4f6;
  border-radius: 8px;
  color: #1f2937;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
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

.btns {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.btn.primary {
  background: #2563eb;
  color: #fff;
}
.btn.primary:hover {
  background: #1e40af;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.25);
}
.btn.primary:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn.secondary {
  background: #e5e7eb;
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
</style>
