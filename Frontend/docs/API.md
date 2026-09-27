# API.md — Описание API

## Базовый URL
`/api/v1`

## Auth эндпоинты
- `POST /auth/register` — регистрация: `{email, password, display_name}`
- `POST /auth/login` — вход: `{email, password}`
- `GET /auth/me` — текущий пользователь

## Scenarios эндпоинты
- `GET /scenarios` — список сценариев (opционально с limit/offset)

## Session эндпоинты
- `POST /sessions` — старт сессии: `{scenario_id}`
- `GET /sessions/{id}/node` — текущий узел сессии
- `POST /sessions/{id}/choices` — выбор: `{choice_key}`
- `POST /sessions/{id}/timeout` — истечение таймера
- `POST /sessions/{id}/finish` — завершение сессии
- `GET /sessions/{id}/debrief` — разбор сессии

## Profile эндпоинты
- `GET /profile` — профиль пользователя
- `GET /profile/achievements` — ачивки пользователя

## Leaderboard эндпоинты
- `GET /leaderboard` — лидерборд (опционально с limit и scope)

## Ошибки
- `401` — неавторизован, → logout + /login
- `404` — не найдено
- `5xx` — серверная ошибка, → toast + retry

## Mock-данные
Доступны фикстуры в `src/api/mock/fixtures.ts`:
- `mockProfile` — профиль пользователя
- `mockDebrief` — разбор сессии