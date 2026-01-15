<div align="center">

<!-- Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=SoulMap&fontSize=42&fontColor=fff&animation=twinkling&fontAlignY=32&desc=AI-Powered%20Journal%20Analysis&descSize=18&descAlignY=52"/>

<!-- Badges -->
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

<p align="center">
  <b>日記を分析してあなたの感情・性格傾向を可視化するアプリケーション</b>
</p>

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API](#-api-endpoints) • [Structure](#-project-structure)

</div>

---

## ✨ Features

<table>
  <tr>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/96/000000/edit.png" width="60"/>
      <br><b>Journal Posts</b>
      <br><sub>テキスト＋画像付き日記</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/96/000000/happy.png" width="60"/>
      <br><b>Mood Tracking</b>
      <br><sub>気分タグで感情記録</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/96/000000/brain.png" width="60"/>
      <br><b>AI Analysis</b>
      <br><sub>GPT-4による深層分析</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/fluency/96/000000/combo-chart.png" width="60"/>
      <br><b>Visualization</b>
      <br><sub>感情・性格の可視化</sub>
    </td>
  </tr>
</table>

### AI分析の内容

| 分析項目 | 説明 |
|:---:|:---|
| 🎭 **感情スコア** | Joy, Sadness, Anger, Fear, Surprise の5感情を数値化 |
| 🧠 **性格特性** | Big Five モデル（開放性・誠実性・外向性・協調性・神経症傾向） |
| 🏷️ **トピック抽出** | 日記から主要トピックを自動抽出 |
| 💡 **興味関心** | 継続的な興味・関心領域を特定 |
| 📊 **総合サマリー** | 複数投稿を横断した傾向分析 |

---

## 🛠 Tech Stack

<table>
  <tr>
    <th align="center">Frontend</th>
    <th align="center">Backend</th>
    <th align="center">Database</th>
    <th align="center">AI</th>
  </tr>
  <tr>
    <td align="center">
      <img src="https://skillicons.dev/icons?i=nextjs,ts,tailwind" /><br>
      <sub>Next.js 14 • TypeScript<br>Tailwind CSS • shadcn/ui<br>TanStack Query • Recharts</sub>
    </td>
    <td align="center">
      <img src="https://skillicons.dev/icons?i=python,fastapi" /><br>
      <sub>Python 3.11+<br>FastAPI • SQLAlchemy 2.0<br>Pydantic • JWT Auth</sub>
    </td>
    <td align="center">
      <img src="https://skillicons.dev/icons?i=postgres,docker" /><br>
      <sub>PostgreSQL 15<br>Docker Compose<br>Alembic Migrations</sub>
    </td>
    <td align="center">
      <img src="https://img.icons8.com/fluency/96/000000/chatgpt.png" width="48"/><br>
      <sub>OpenAI API<br>GPT-4</sub>
    </td>
  </tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

```
Docker & Docker Compose  •  Node.js 18+  •  Python 3.11+
```

### Installation

<details>
<summary><b>1️⃣ Clone & Setup Database</b></summary>

```bash
# Clone the repository
git clone https://github.com/mituoka/soulmap.git
cd soulmap

# Start PostgreSQL
docker-compose up -d
```

</details>

<details>
<summary><b>2️⃣ Backend Setup</b></summary>

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

</details>

<details>
<summary><b>3️⃣ Frontend Setup</b></summary>

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

</details>

### 🔗 Access Points

| Service | URL |
|:---:|:---|
| 🌐 Frontend | http://localhost:3000 |
| ⚡ Backend API | http://localhost:8000 |
| 📚 API Docs | http://localhost:8000/docs |

---

## 🔐 Environment Variables

<details>
<summary><b>Backend (.env)</b></summary>

```env
DATABASE_URL=postgresql://soulmap:soulmap123@localhost:5432/soulmap_db
JWT_SECRET_KEY=your-secret-key-change-in-production
OPENAI_API_KEY=sk-your-openai-api-key
```

</details>

<details>
<summary><b>Frontend (.env.local)</b></summary>

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

</details>

---

## 📡 API Endpoints

<details>
<summary><b>🔑 Authentication</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/v1/auth/register` | ユーザー登録 |
| `POST` | `/api/v1/auth/login` | ログイン |
| `GET` | `/api/v1/auth/me` | 現在のユーザー情報 |

</details>

<details>
<summary><b>📝 Posts</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/v1/posts` | 投稿一覧 |
| `GET` | `/api/v1/posts/{id}` | 投稿詳細 |
| `POST` | `/api/v1/posts` | 投稿作成 |
| `PUT` | `/api/v1/posts/{id}` | 投稿更新 |
| `DELETE` | `/api/v1/posts/{id}` | 投稿削除 |

</details>

<details>
<summary><b>🧠 Analyses</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/v1/analyses/create` | AI分析実行 |
| `GET` | `/api/v1/analyses/post/{post_id}` | 投稿の分析結果 |
| `GET` | `/api/v1/analyses/user/summary` | ユーザーサマリー |

</details>

<details>
<summary><b>📤 Uploads</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/v1/uploads/image` | 画像アップロード |

</details>

---

## 📁 Project Structure

```
soulmap/
├── 🐍 backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Security & AI service
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # DB connection
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # Migrations
│   └── requirements.txt
│
├── ⚛️ frontend/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   └── types/               # TypeScript definitions
│
└── 🐳 docker-compose.yml
```

---

## 📄 License

<div align="center">

MIT License © 2025

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer"/>

</div>
