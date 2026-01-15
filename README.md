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

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [API](#api-endpoints) • [Structure](#project-structure)

</div>

---

## Features

<div align="center">

| Journal | Mood | AI Analysis | Insights |
|:---:|:---:|:---:|:---:|
| テキスト＋画像 | 気分タグ記録 | GPT-4分析 | データ可視化 |

</div>

<br>

### AI Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│  Emotions      Joy • Sadness • Anger • Fear • Surprise          │
├─────────────────────────────────────────────────────────────────┤
│  Personality   Big Five Model (O・C・E・A・N)                    │
├─────────────────────────────────────────────────────────────────┤
│  Topics        Auto-extracted from journal entries              │
├─────────────────────────────────────────────────────────────────┤
│  Interests     Identify recurring themes                        │
├─────────────────────────────────────────────────────────────────┤
│  Summary       Cross-post trend analysis                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

<div align="center">

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js_14-000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![React Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white)

**Backend**

![Python](https://img.shields.io/badge/Python_3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000?style=flat-square&logo=jsonwebtokens&logoColor=white)

**Infrastructure**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI_GPT--4-412991?style=flat-square&logo=openai&logoColor=white)

</div>

---

## Getting Started

### Prerequisites

```
Docker & Docker Compose  •  Node.js 18+  •  Python 3.11+
```

### Installation

<details>
<summary><b>1. Clone & Setup Database</b></summary>

```bash
# Clone the repository
git clone https://github.com/mituoka/soulmap.git
cd soulmap

# Start PostgreSQL
docker-compose up -d
```

</details>

<details>
<summary><b>2. Backend Setup</b></summary>

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
<summary><b>3. Frontend Setup</b></summary>

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

### Access Points

| Service | URL |
|:---|:---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## Environment Variables

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

## API Endpoints

<details>
<summary><b>Authentication</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/v1/auth/register` | Register |
| `POST` | `/api/v1/auth/login` | Login |
| `GET` | `/api/v1/auth/me` | Current user |

</details>

<details>
<summary><b>Posts</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/v1/posts` | List posts |
| `GET` | `/api/v1/posts/{id}` | Get post |
| `POST` | `/api/v1/posts` | Create post |
| `PUT` | `/api/v1/posts/{id}` | Update post |
| `DELETE` | `/api/v1/posts/{id}` | Delete post |

</details>

<details>
<summary><b>Analyses</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/v1/analyses/create` | Run analysis |
| `GET` | `/api/v1/analyses/post/{post_id}` | Get result |
| `GET` | `/api/v1/analyses/user/summary` | User summary |

</details>

<details>
<summary><b>Uploads</b></summary>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/v1/uploads/image` | Upload image |

</details>

---

## Project Structure

```
soulmap/
│
├── backend/
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
├── frontend/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   └── types/               # TypeScript definitions
│
└── docker-compose.yml
```

---

## License

<div align="center">

MIT License © 2025

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer"/>

</div>
