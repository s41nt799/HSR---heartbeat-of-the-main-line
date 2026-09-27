# SECURITY.md — Безопасность и соответствие 152-ФЗ

## Обработка персональных данных

1. **Синтетические данные** — все отображаемые данные (имена, очки, уровни, ачивки) являются вымышленными для тренажера. Любое совпадение с реальными лицами случайно.

2. **JWT токены** — хранятся в `localStorage` под ключом `access_token`. В продакшене рекомендуется использовать `httpOnly` cookie для защиты от XSS-атак.

3. **localStorage операции** при logout:
   - `localStorage.removeItem('access_token')`
   - `localStorage.removeItem('session_scenario:*')` (клиентский кэш scenario_id)
   - `sessionStorage.clear()` (при необходимости)

4. **Axios interceptor 401**:
   - При получении статуса 401 с сервера:
     - Токен удаляется из localStorage
     - AuthContext сбрасывает токен и пользователя
     - Выполняется редирект на `/login`
     - Кэш TanStack Query очищается (`queryClient.clear()`)

5. **Защита маршрутов**:
   - `ProtectedRoute` проверяет наличие токена перед доступом кprotected-маршрутам
   - При отсутствии токена — немедленный редирект на `/login`
   - Во время загрузки токена (`isLoading`) показывает LoadingState

## Зависимости от окружения

| Переменная | Значение | Описание |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Базовый URL бэкенда |
| `VITE_DEMO_MODE` | `false` | Флаг демо-режима (true/false) |
| `VITE_ENABLE_ANALYTICS` | `true` | Включение анотационной аналитики (опционально) |

## Безопасность зависимостей

- Все зависимости устанавливаются через `npm install` с проверкой `package-lock.json`
- Regular `npm audit` запускается в CI
- Critical уязвимости в `axios` или `react-router-dom` отслеживаются и патчатся

## Incident Response

При обнаружении утечки токена:
1. Немедленное блокирование сессии
2. Очистка localStorage и queryClient кэша
3. Принудительный login пользователя
4. Информирование команды разработки

## Дополнительные меры (для продакшена)

- Переход с `localStorage` на `httpOnly` cookie + CSRF-защита
- HTTPS везде (включая websocket, если будет)
- Rate limiting на бэкенде для auth эндпоинтов
- Refresh token ротация (если понадобится долгая сессия)