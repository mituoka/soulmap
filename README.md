<div align="center">

<!-- Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=SoulMap&fontSize=42&fontColor=fff&animation=twinkling&fontAlignY=32&desc=AI%E6%97%A5%E8%A8%98%E5%88%86%E6%9E%90%E3%82%A2%E3%83%97%E3%83%AA&descSize=18&descAlignY=52"/>

<!-- Badges -->
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

<p align="center">
  <b>日記を書くだけで、AIがあなたの感情・性格傾向を可視化</b>
</p>

[機能](#機能) • [技術スタック](#技術スタック) • [セットアップ](#セットアップ) • [API](#api-エンドポイント)

</div>

---

## 機能

<div align="center">

| ジャーナル | 画像 | AI分析 | ダークモード |
|:---:|:---:|:---:|:---:|
| テキスト投稿 | 複数画像対応 | Gemini分析 | ライト/ダーク切替 |
| 検索・フィルタ | D&D/ペースト | 感情・性格分析 | システム連動 |

</div>

<br>

### AI分析機能

```
┌─────────────────────────────────────────────────────────────────┐
│  感情分析      喜び・悲しみ・怒り・恐れ・驚き                      │
├─────────────────────────────────────────────────────────────────┤
│  性格傾向      ビッグファイブ（O・C・E・A・N）                     │
├─────────────────────────────────────────────────────────────────┤
│  トピック      日記から自動抽出                                   │
├─────────────────────────────────────────────────────────────────┤
│  関心事        繰り返し出現するテーマを特定                        │
├─────────────────────────────────────────────────────────────────┤
│  サマリー      複数投稿からの傾向分析                              │
└─────────────────────────────────────────────────────────────────┘
```

### 投稿機能

- **複数画像アップロード**: 1投稿に複数の画像を添付可能
- **ドラッグ&ドロップ**: 画像をドラッグして直接アップロード
- **ペースト対応**: クリップボードから画像を貼り付け
- **検索・フィルタ**: キーワード検索、日付範囲でのフィルタリング

### テーマ切り替え

- **ライトモード**: 明るい配色
- **ダークモード**: 目に優しい暗い配色
- **システム連動**: OSの設定に自動追従

---

## 技術スタック

<div align="center">

**フロントエンド**

![Next.js](https://img.shields.io/badge/Next.js_14-000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![React Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white)

**バックエンド**

![Python](https://img.shields.io/badge/Python_3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000?style=flat-square&logo=jsonwebtokens&logoColor=white)

**インフラ・AI**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_Flash-4285F4?style=flat-square&logo=google&logoColor=white)

</div>

---

## セットアップ

### 必要なもの

```
Docker & Docker Compose
Gemini API キー（無料で取得可能）
```

### クイックスタート（Docker）

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/soulmap.git
cd soulmap

# 環境変数を設定
cp backend/.env.example backend/.env
# backend/.env を編集して GEMINI_API_KEY を設定

# 起動
docker compose up -d
```

### Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/apikey) にアクセス
2. 「APIキーを作成」をクリック
3. 取得したキーを `backend/.env` の `GEMINI_API_KEY` に設定

### アクセス先

| サービス | URL |
|:---|:---|
| フロントエンド | http://localhost:3000 |
| バックエンドAPI | http://localhost:8000 |
| APIドキュメント | http://localhost:8000/docs |

---

## 環境変数

### バックエンド (backend/.env)

```env
DATABASE_URL=postgresql://soulmap:soulmap123@localhost:5432/soulmap_db
JWT_SECRET_KEY=your-secret-key-change-in-production
GEMINI_API_KEY=your-gemini-api-key
```

### フロントエンド (frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API エンドポイント

### 認証

| メソッド | エンドポイント | 説明 |
|:---:|:---|:---|
| `POST` | `/api/v1/auth/register` | ユーザー登録 |
| `POST` | `/api/v1/auth/login` | ログイン |
| `GET` | `/api/v1/auth/me` | 現在のユーザー情報 |

### 投稿

| メソッド | エンドポイント | 説明 |
|:---:|:---|:---|
| `GET` | `/api/v1/posts` | 投稿一覧（検索・フィルタ対応） |
| `GET` | `/api/v1/posts/{id}` | 投稿詳細 |
| `POST` | `/api/v1/posts` | 新規投稿 |
| `PUT` | `/api/v1/posts/{id}` | 投稿更新 |
| `DELETE` | `/api/v1/posts/{id}` | 投稿削除 |

### 分析

| メソッド | エンドポイント | 説明 |
|:---:|:---|:---|
| `POST` | `/api/v1/analyses/create` | AI分析を実行 |
| `GET` | `/api/v1/analyses/post/{post_id}` | 分析結果取得 |
| `GET` | `/api/v1/analyses/user/summary` | ユーザーサマリー |

### アップロード

| メソッド | エンドポイント | 説明 |
|:---:|:---|:---|
| `POST` | `/api/v1/uploads/image` | 画像アップロード |

---

## プロジェクト構成

```
soulmap/
│
├── backend/
│   ├── app/
│   │   ├── api/v1/          # APIエンドポイント
│   │   ├── core/            # セキュリティ・AIサービス
│   │   ├── models/          # SQLAlchemyモデル
│   │   ├── schemas/         # Pydanticスキーマ
│   │   ├── config.py        # 設定
│   │   ├── database.py      # DB接続
│   │   └── main.py          # FastAPIアプリ
│   ├── alembic/             # マイグレーション
│   └── requirements.txt
│
├── frontend/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Reactコンポーネント
│   ├── hooks/               # カスタムフック
│   ├── lib/                 # ユーティリティ
│   └── types/               # TypeScript型定義
│
└── docker-compose.yml
```

---

## ライセンス

<div align="center">

MIT License © 2025

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer"/>

</div>
