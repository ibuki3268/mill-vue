# mill-vue

フロントエンドをvue、バックエンドをsupabaseで行っている

## 目的
- メール認証不要の公開リンク（public_token）で投票を行う
- ブラウザごとの voter_token を localStorage に保存して再投票を上書き

## 必須環境
- Node.js
- npm
- Supabase アカウント

## 環境変数
プロジェクトルートに `.env.local` を作成し、以下を設定Supabase ダッシュボード → Project → Settings → API から取得

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

チーム共有用に `.env.local.example` をコミットする

## Supabaseテーブル作成
Supabase の SQL エディタで以下を実行

```sql
create extension if not exists "pgcrypto";

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  choices jsonb not null,
  public_token text unique not null,
  created_at timestamptz default now()
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  voter_token text,
  choice text not null,
  created_at timestamptz default now(),
  updated_at timestamptz
);


create unique index if not exists votes_poll_voter_unique
on votes (poll_id, voter_token);
```

サンプル poll を挿入する場合:
```sql
insert into polls (title, choices, public_token)
values (
  '冷房の温度感',
  '["暑い","寒い","ちょうどよい"]'::jsonb,
  encode(gen_random_bytes(8), 'hex')
)
returning id, public_token;
```

## ローカル起動

```bash
npm run dev
```

ローカルホストリンク `http://localhost:5173` 
サンプル poll の public_token を取得している場合は `http://localhost:5173/p/{public_token}` に直接可能



## 本番化の注意点
- anon key をクライアントで公開したまま書き込みを許可すると不正投票のリスク
本番化では Edge Function（またはサーバ）経由で書き込みを行い、RLS を有効化することを推奨します。


---
Created for collaborative development — feel free to open an issue or ask for changes.
# mill-vue

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
