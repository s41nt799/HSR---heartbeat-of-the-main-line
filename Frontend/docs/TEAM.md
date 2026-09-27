# TEAM.md — Команда

## Разработка фронтенда

| Имя | Роль | Контакты |
|---|---|---|
| Аналитик/Фронтэнд-разработчик | React 18 + TS + Vite + TanStack Query + Zustand + Tailwind + Axios | Внутренний чат |

## Архитектурные решения

- **Стек**: React 18 (StrictMode), TypeScript strict, Vite 6, TanStack Query 5, Zustand 5, Tailwind CSS 3, Axios 1.x
- **Маршрутизация**: react-router-dom 6
- **Состояние**: Auth — Zustand, Query TanStack Query, Timer — useRef + useEffect + useState
- **Стилизация**: Tailwind CSS с кастомными анимациями (fade, pulseSoft, achievementIn)
- **API**: Axios с interceptors (401 → logout), отдельный api/-слой для всех запросов
- **Точность**: TypeScript strict mode, нет any в компонентах

## История изменений (последние 3 дня)

- **День 1**: Догрузка сессий, восстановление после F5, protected routes, level/score в хедере, профиль, дебриф, лидерборд
- **День 2**: Таймер с deadline от сервера, auto-post /timeout, toast-система, score breakdown, ачивки, события, critical decisions, mistakes, рекомендации
- **День 3**: Полировка UI, демо-режим, docs/ folder, DEMO_SCRIPT.md, негативные проверки

## Вклад в репозиторий

Все разработчики следуют правилам:
1. TypeScript strict, без any
2. Все запросы через api/-слой
3. Loading / empty / error на всех экранах
4. Кнопки disabled при isPending или state !== 'active'
5. Minimal CSS transitions, no multimedia