# SoulMap

AI-powered journal analysis app - 日記を分析してあなたの感情・性格傾向を可視化するアプリケーション

## Features

- **日記投稿**: テキスト + 画像付きの日記を作成・編集・削除
- **気分タグ**: 投稿時に気分を選択可能（Happy, Sad, Excited, Calm など）
- **AI分析**: OpenAI APIを使用して投稿内容を分析
  - 感情スコア（Joy, Sadness, Anger, Fear, Surprise）
  - 性格特性（Big Five: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism）
  - トピック抽出・興味関心の分析
- **ユーザーサマリー**: 複数の投稿を横断した総合分析

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query (React Query)
- Recharts

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy 2.0
- Pydantic
- JWT認証

### Database
- PostgreSQL 15

### AI
- OpenAI API (GPT-4)

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Clone the repository

```bash
git clone https://github.com/mituoka/soulmap.git
cd soulmap
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

### 5. Access the app

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://soulmap:soulmap123@localhost:5432/soulmap_db
JWT_SECRET_KEY=your-secret-key-change-in-production
OPENAI_API_KEY=sk-your-openai-api-key
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | ユーザー登録 |
| POST | `/api/v1/auth/login` | ログイン |
| GET | `/api/v1/auth/me` | 現在のユーザー情報 |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/posts` | 投稿一覧 |
| GET | `/api/v1/posts/{id}` | 投稿詳細 |
| POST | `/api/v1/posts` | 投稿作成 |
| PUT | `/api/v1/posts/{id}` | 投稿更新 |
| DELETE | `/api/v1/posts/{id}` | 投稿削除 |

### Analyses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/analyses/create` | AI分析実行 |
| GET | `/api/v1/analyses/post/{post_id}` | 投稿の分析結果 |
| GET | `/api/v1/analyses/user/summary` | ユーザーサマリー |

### Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/uploads/image` | 画像アップロード |

## Project Structure

```
soulmap/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # APIエンドポイント
│   │   ├── core/            # セキュリティ、AIサービス
│   │   ├── models/          # SQLAlchemyモデル
│   │   ├── schemas/         # Pydanticスキーマ
│   │   ├── config.py        # 設定
│   │   ├── database.py      # DB接続
│   │   └── main.py          # FastAPIアプリ
│   ├── alembic/             # マイグレーション
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Reactコンポーネント
│   ├── hooks/               # カスタムフック
│   ├── lib/                 # ユーティリティ
│   └── types/               # TypeScript型定義
└── docker-compose.yml
```

## License

MIT
