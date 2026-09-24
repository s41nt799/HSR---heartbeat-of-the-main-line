# Тренажёр проводника — Frontend

Демо-приложение для тренировки решений проводника (React + Vite + TypeScript).

## Запуск

```bash
cd conductor-trainer
npm install
cp .env.example .env
npm run dev
```

Откройте http://localhost:5173

По умолчанию Vite проксирует `/api` → `http://localhost:8000`.
Если backend на другом хосте, задайте `VITE_API_BASE_URL` в `.env`.

## День 1

- Login / Register
- Список сценариев
- Проигрывание сессии (узлы, выборы, шкалы loyalty/safety/score)
- Провал при `state === failed` → stub дебрифа
