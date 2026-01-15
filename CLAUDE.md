# CLAUDE.md

このファイルはClaude Codeがプロジェクトで作業する際のガイドラインです。

## Git Workflow

### ブランチ戦略

- **mainブランチに直接pushしない**
- 新機能・修正は必ずfeatureブランチを作成する
- ブランチ名の規則: `feature/<機能名>`, `fix/<修正内容>`, `refactor/<リファクタ内容>`
- 作業完了後はPull Requestを作成してマージする

### 作業フロー

```bash
# 1. featureブランチを作成
git checkout -b feature/new-feature

# 2. 作業・コミット
git add .
git commit -m "Add new feature"

# 3. リモートにpush
git push -u origin feature/new-feature

# 4. Pull Requestを作成
gh pr create --title "Add new feature" --body "..."

# 5. マージ後、ローカルを更新
git checkout main
git pull origin main
git branch -d feature/new-feature
```

### コミットメッセージ

- 英語で記述
- 動詞から始める（Add, Fix, Update, Remove, Refactor）
- 簡潔に（50文字以内推奨）
- Co-Authored-Byを含める

## プロジェクト構成

```
soulmap/
├── backend/     # Python/FastAPI
├── frontend/    # Next.js 14
└── docker-compose.yml
```

## 開発コマンド

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm run dev
```

### Database

```bash
docker-compose up -d  # PostgreSQL起動
cd backend && alembic upgrade head  # マイグレーション
```

## コーディング規約

### Backend (Python)

- Python 3.11+
- 型ヒント必須
- Pydanticでスキーマ定義
- エンドポイントは `/api/v1/` 以下

### Frontend (TypeScript)

- TypeScript strict mode
- コンポーネントは `components/` に配置
- カスタムフックは `hooks/` に配置
- API呼び出しは `lib/api.ts` 経由

## 環境変数

- Backend: `backend/.env`
- Frontend: `frontend/.env.local`
- **機密情報はコミットしない**（.gitignoreで除外済み）
