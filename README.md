# チャレンジキャラバン　チームミルフィーユ

## メンバー
- [いぶき](https://github.com/ibuki3268)
- [かわ](https://github.com/tRensn)


## 環境
- Node.js
- Supabase

## 環境変数
プロジェクトルートに `.env.local` を作成し、以下を設定Supabase ダッシュボード → Project → Settings → API から取得

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

チーム共有用に `.env.local.example` をコミット

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

## ルーム対応（複数グループで分ける）

このアプリではルーム（room_token）ごとに投票を分離できます。フロント側ではルートとして

- `/r/:room_token/p/:public_token`（投票ページ）
- `/r/:room_token/p/:public_token/results`（結果ページ）

としてアクセスします。既存の `/p/:public_token` ルートは後方互換として残します。

バックエンド（Supabase）側でルームを使うには `polls` と `votes` に `room_token` カラムを追加すると簡単です。SQL例:

```sql
-- polls に room_token を追加（既存データは NULL のまま）
alter table polls add column if not exists room_token text;

-- votes に room_token を追加（オプションだがあるとデバッグしやすい）
alter table votes add column if not exists room_token text;

-- 新規に room スコープの poll を挿入する例
insert into polls (title, choices, public_token, room_token)
values (
  '部屋A用の投票',
  '["はい","いいえ"]'::jsonb,
  encode(gen_random_bytes(8), 'hex'),
  'room-A-123'
)
returning id, public_token, room_token;
```

※マイグレーション後、`public_token` と `room_token` の組み合わせで意図した poll が返るようになります。

フロント実装は既にルームパラメータを受け取るようにしてあります。ルームスコープで投票するには、ルーム付きURLでアクセスしてください。
