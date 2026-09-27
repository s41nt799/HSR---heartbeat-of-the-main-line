# Тренажёр проводника ВСМ

Платформа обучения проводников высокоскоростной магистрали через интерактивные игровые сценарии. Пользователь проходит нелинейные сценарии, принимает решения в условиях таймера, видит последствия и получает ачивки.

## Для кого

- Проводники ВСМ — повышение квалификации
- Инструкторы — подготовка смен и оценка навыков
- Менеджеры по обучению — аналитика компетенций

## Что умеет

- **Движок сценариев** — нелинейные диалоги с ветвлением, условиями и несколькими концовками
- **Таймеры** — критические решения с ограничением времени; просрочка влияет на исход
- **Двойная шкала** — лояльность пассажира и рейтинг безопасности
- **Геймификация** — профиль, уровни, очки компетенций, ачивки, лидерборд
- **Дебриф** — разбор последствий каждого решения и рекомендации
- **Аналитика** — прогресс по компетенциям, слабые зоны, история сессий

## Архитектура
```
Frontend (React + TS) → Backend (FastAPI) → PostgreSQL + Redis
↑
Content JSON
(сценарии, ачивки)
```
### Стек

**Backend:**
- Python 3.11, FastAPI, SQLAlchemy 2.0 (async), Alembic
- PostgreSQL 15, Redis (лидерборд)
- JWT (access + refresh)
- Docker, Docker Compose

**Frontend:**
- React 18, TypeScript (strict, без `any`)
- Vite 6
- TanStack Query 5
- Zustand 5
- Tailwind CSS 3
- Axios 1.x

**Контент:**
- Сценарии и ачивки — JSON-файлы в `content/`, загружаются сидом

## Быстрый старт

### Требования

- Docker, Docker Compose
- (для локальной разработки) Python 3.11+, Node 18+

### Запуск одной командой

```bash
docker compose up --build
```
После старта:

Frontend: http://localhost:5173

Backend API: http://localhost:8000

Swagger UI: http://localhost:8000/docs

ReDoc: http://localhost:8000/redoc

Демо-доступ
```text
Email:    demo@vsm.ru
Password: demo1234
```

Применение миграций и сидов
```bash
# миграции
docker compose exec backend alembic upgrade head
```
Запуск сидов (демо-юзер, 2 сценария, 10 ачивок, лидерборд)
```
cd backend 
python seed.py
```
Переменные окружения
Backend — .env в корне
```.env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/gamification
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_TTL_MINUTES=30
```
Frontend — .env.local в frontend/
```.env
VITE_API_BASE_URL=/api/v1
VITE_DEMO_MODE=false
VITE_API_BASE_URL — базовый URL API (по умолчанию /api/v1)
VITE_DEMO_MODE — демо-режим: длинные дедлайны, предзаполненная сессия, кнопка сброса
```

Модули
```text
Модуль	    Назначение
Авторизация	Регистрация, вход, обновление токенов
Сценарии	Каталог доступных сценариев
Сессии	    Игровой движок: старт, узлы, выборы, таймауты
Аналитика  	Прогресс по компетенциям, слабые зоны, история
Профиль	    Данные пользователя, статистика прохождений
Ачивки	    Справочник и прогресс получения
Уведомления	Оповещения о достижениях
Лидерборд	Топ проводников по общему счёту
```
Структура репозитория:
```text
├── backend/
│   ├── app/
│   │   ├── api/            # роуты
│   │   ├── models/         # SQLAlchemy-модели
│   │   ├── schemas/        # Pydantic-схемы
│   │   ├── services/       # бизнес-логика
│   │   └── main.py
│   ├── alembic/            # миграции
│   ├── seed.py             # загрузка сидов из content/
│   └── pyproject.toml
│
├── frontend/
│   ├── src/
│   │   ├── api/            # axios client + API-слой
│   │   ├── hooks/          # useAuth, useSession, useTimer, useToast
│   │   ├── components/     # UI-компоненты
│   │   ├── pages/          # страницы
│   │   ├── types/          # TypeScript-типы
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── content/                # JSON-контент (сиды)
│   ├── passenger-conflict.json
│   ├── medical-incident.json
│   └── achievements.json
│
├── docs/                   # документация
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── USER_FLOW.md
│   ├── LIMITATIONS.md
│   ├── ROADMAP.md
│   ├── TEAM.md
│   └── SECURITY.md
│
├── DEMO_SCRIPT.md          # легенда показа на 3 минуты
├── docker-compose.yml
└── README.md
```
Локальная разработка
Backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend
```bash
cd frontend
npm install
npm run dev       # dev-сервер
npm run build     # production-сборка
npm run preview   # предпросмотр сборки
```
Vite проксирует /api/* на http://localhost:8000 — CORS не нужен.

Контент
Сценарии и ачивки хранятся как JSON в content/ и загружаются сидом в БД. Добавить новый сценарий можно без пересборки ядра:

Создать content/my-scenario.json по схеме (см. content/README.md)

Запустить сид: docker compose exec backend python seed.py

Сценарий появится в каталоге

Синтетические данные (152-ФЗ)
Все данные в приложении — вымышленные и предназначены исключительно для тренировочных целей. Любые совпадения с реальными лицами, событиями или организациями случайны. Приложение не собирает и не обрабатывает реальные персональные данные в соответствии с Федеральным законом № 152-ФЗ «О персональных данных».

Секреты (JWT, БД, Redis) — только через .env, не в коде и не в репозитории. Шаблон — .env.example.

Команда
См. ```docs/TEAM.md``` — кто что делал.

Документация
```text
Документ	О чём
```docs/ARCHITECTURE.md```	Диаграмма компонентов и последовательностей
```docs/API.md```	Описание эндпоинтов, примеры запросов
```docs/USER_FLOW.md```	Путь пользователя от логина до дебрифа
```docs/LIMITATIONS.md```	Что не реализовано и почему
```docs/ROADMAP.md```	План развития после хакатона
```docs/TEAM.md```	Роли и вклад команды
```docs/SECURITY.md```	Безопасность, 152-ФЗ, обработка ошибок
```DEMO_SCRIPT.md```	Легенда показа на 3 минуты
```Swagger UI	http://localhost:8000/docs```
```ReDoc	http://localhost:8000/redoc```
```
