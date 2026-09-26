# Tренажёр проводника ВСМ

Приложение для тренировки навыков проводника Воздушно-походной службы материальово-технического обеспечения.

## Для кого

- Кадры ВСМ для поддержки и повышения квалификации
- Инструкторы по materiale-tochnomu obespecheniyu
- Менеджеры по обеспечению materialovo-tehnicheskogo obespecheniya

## Стек технологий

- **React 18** — библиотека интерфейса
- **TypeScript** — строгая типизация (strict mode, без any)
- **Vite 6** — быстрая разработка и сборка
- **TanStack Query 5** — управление данными и кэширование
- **Zustand 5** — состояние авторизации
- **Tailwind CSS 3** — стилизация
- **Axios 1.x** — HTTP клиент с interceptors

## Запуск проекта

### Docker Compose (одной командой)

```bash
docker compose up --build
```

Или вручную:

```bash
# Установка зависимостей
npm install

# Development режим
npm run dev

# Build для production
npm run build

# Preview production build
npm run preview
```

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
VITE_API_BASE_URL=/api/v1
VITE_DEMO_MODE=false
```

Доступные переменные:
- `VITE_API_BASE_URL` — базовый URL бэкенда (по умолчанию `/api/v1`)
- `VITE_DEMO_MODE` — включить демо-режим (true/false, по умолчанию `false`)

## Структура репозитория

```
src/
  api/              — Axios client + API layer
  hooks/            — Custom React hooks
  components/       — UI-компоненты
  pages/            — Страницы маршрутизации
  hooks/            — useAuth, useSession, useTimer, useLevel, useToast
  types/            — TypeScript типы
  App.tsx           — Основной компонент с роутером
  main.tsx — Точка входа

docs/               — Документация (ARCHITECTURE, API, USER_FLOW, LIMITATIONS, ROADMAP, TEAM, SECURITY)
DEMO_SCRIPT.md      — Скрипт для демо-режима (3 минуты)
DEV_AUDIT_STAGE_A.md — Аудит Дней 1-2

package.json        — Зависимости и скрипты
tailwind.config.js  — Конфигурация Tailwind
vite.config.ts      — Конфигурация Vite
```

## Демо-режим

Для включения демо-режима установите переменную окружения:

```env
VITE_DEMO_MODE=true
```

В демо-режиме:
- Длинные дедлайны (120 секунд вместо 12)
- Предзаполненная медицинская сессия на critical-узле
- Кнопка «Сбросить демо» (только в DEMO_MODE) — сбрасывает сессию на бэкенде
- Бейдж «DEMO» в углу экрана

## Синтетические данные (152-ФЗ)

Все данные в приложении являются вымышленными и предназначены исключительно для тренировочных целей. Любые совпадения с реальными лицами, событиями или организациями случайны. Приложение не собирает и не обрабатывает реальные персональные данные в соответствии с требованиями Федерального закона № 152-ФЗ «О персональных данных».

## Команда

См. `docs/TEAM.md` для подробной информации о команде разработки.

## Ссылки на документацию

- `docs/ARCHITECTURE.md` — диаграмма компонентов и последовательностей
- `docs/API.md` — описание API эндпоинтов
- `docs/USER_FLOW.md` — пользовательские сценарии
- `docs/LIMITATIONS.md` — ограничения решения
- `docs/ROADMAP.md` — план развития после хакатона
- `docs/TEAM.md` — кто что делал
- `docs/SECURITY.md` — безопасность и 152-ФЗ
- `DEMO_SCRIPT.md` — скрипт для демо-режима (3 минуты)