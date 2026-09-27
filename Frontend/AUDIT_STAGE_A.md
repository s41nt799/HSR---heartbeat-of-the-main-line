# ЭТАП A. АУДИТ ФРОНТАНДА «Тренажёр проводника ВСМ»

## 1. СВОДКА ПО БЛОКАМ

| Блок | ✅ | ⚠️ | ❌ |
|------|---|----|----|
| A.1 Структура и сборка | — | — | 5 |
| A.2 Auth | — | — | 3 |
| A.3 Scenarios | — | — | 1 |
| A.4 Play — узел и таймер | — | — | 3 |
| A.5 Play — выбор | — | — | 1 |
| A.6 Play — timeout | — | — | 0 |
| A.7 Play — завершение | — | — | 0 |
| A.8 Debrief | — | — | 5 |
| A.9 Profile | — | — | 3 |
| A.10 Analytics | — | — | 2 |
| A.11 Роутинг и навигация | — | — | 3 |
| A.12 Обработка ошибок | — | — | 1 |
| A.13 State management | — | — | 0 |
| A.14 Код-стайл и мёртвый код | — | — | 3 |
| A.15 Безопасность и данные | — | — | 1 |
| A.16 Специфика хакатона | — | — | 0 |

**Итого: 0 ✅, 0 ⚠️, 29 ❌** (блоки без ❌ помечены «—»).

---

## 2. ТАБЛИЦА ПРОБЛЕМ

### 🔴 BLOCKER (ломает приложение или сборку)

| # | Файл:строка | Суть | Серьёзность | Фикс |
|---|------------|------|------------|------|
| 1 | `src/api/client.ts:2` | `ApiErrorBody` не экспортируется из `types/api.ts`. Сборка падает. | blocker | Добавить `ApiErrorBody` в типы |
| 2 | `src/components/AchievementCard.tsx:1` | `Achievement` не существует в `types/api.ts`. Сборка падает. | blocker | Добавить тип или убрать импорт |
| 3 | `src/components/EventRow.tsx:1` | `EventType` не существует в `types/api.ts`. Сборка падает. | blocker | Добавить тип или заменить на inline |
| 4 | `src/utils/effectsToast.ts:1` | `Effects` не существует в `types/api.ts`. Сборка падает. | blocker | Добавить тип `Effects` |
| 5 | `src/pages/Debrief.tsx:13` | `SessionState` не существует в `types/api.ts`. Сборка падает. | blocker | Добавить или заменить |
| 6 | `src/pages/Register.tsx:3` | `getErrorMessage` импортируется из `../hooks/useAuth`, но экспортируется только из `../api/client`. Сборка падает. | blocker | Изменить импорт |
| 7 | `src/pages/Register.tsx:38` | `register(email.trim(), password, displayName.trim())` — 3 аргумента, но `register(body: AuthRegisterRequest)` ждёт 1 объект. | blocker | Передать объект `{ email, password, display_name }` |
| 8 | `src/pages/Leaderboard.tsx:2` | `leaderboardApi` не экспортируется из `../api`. Сборка падает. | blocker | Удалить страницу и роут (нет бэкенда) ИЛИ добавить API |
| 9 | `src/pages/Achievements.tsx:15` | `profileApi.achievements` не существует. Сборка падает. | blocker | Удалить страницу и роут (нет бэкенда) ИЛИ добавить API |
| 10 | `src/components/ProtectedRoute.tsx:6` | `token` не существует в `AuthContextValue`. Сборка падает. | blocker | Добавить `token` в контекст или убрать деструктуризацию |
| 11 | `src/pages/Debrief.tsx:113-118` | Деструктуризация `final`, `score_breakdown`, `critical_decisions`, `mistakes`, `unlocked_achievements` — ни одно поле не существует в `SessionDebriefResponse`. Сборка падает + рантайм-ошибки. | blocker | Переписать под реальную структуру `SessionDebriefResponse` |

### 🟡 MAJOR (ломает UX или логику)

| # | Файл:строка | Суть | Серьёзность | Фикс |
|---|------------|------|------------|------|
| 12 | `src/hooks/useTimer.ts:12-15` | `useTimer` принимает `(deadline: string, serverNow: string, onExpire)`, но `Play.tsx:112-115` передаёт `node!.timer_left_sec` (number) и `node!.timer_sec` (number). `Date.parse(number)` даёт NaN → таймер всегда 0/не работает. | major | Переписать `useTimer` под `(timerLeftSec: number \| null, ...)` или исправить вызов |
| 13 | `src/pages/Play.tsx:130` | `if (result.new_state !== 'active' \|\| result.finished)` — условие `||` означает, что при `new_state === 'active' && finished === true` редирект не происходит. Логика не соответствует контракту. | major | Заменить на `&&` |
| 14 | `src/pages/Debrief.tsx:53` | `sessionsApi.create({ scenario_id: scenarioId })` — `create` ожидает `string`, а не `{ scenario_id: string }`. | major | Вызвать `sessionsApi.create(scenarioId)` |
| 15 | `src/pages/Profile.tsx:65` | `const { stats, recent_sessions, achievements_preview } = data` — `ProfileResponse` не содержит этих полей. | major | Добавить недостающие поля в `ProfileResponse` ИЛИ убрать деструктуризацию |
| 16 | `src/pages/Profile.tsx:105-108` | `stats.sessions_completed`, `stats.sessions_failed`, `stats.avg_score`, `stats.best_score` — `stats` не определён. | major | Исправить на уровне `ProfileResponse` |
| 17 | `src/pages/Debrief.tsx:168-171` | `FinalCard label="Score" value={final.score}` — в `SessionDebriefResponse` поле `final_score`, не `score`. И `final` объекта нет. | major | Заменить `final.score` → `data.final_score`, `final.loyalty` → `data.loyalty`, `final.safety` → `data.safety` |
| 18 | `src/pages/Debrief.tsx:179-185` | `ScoreBreakdown` получает `score_breakdown.base/speed_bonus/completion_bonus/penalty` — поле `score_breakdown` не существует в `SessionDebriefResponse`. | major | Удалить блок или добавить поле в тип |
| 19 | `src/pages/Debrief.tsx:196-223` | `critical_decisions` не существует в `SessionDebriefResponse`. | major | Удалить блок |
| 20 | `src/pages/Debrief.tsx:226-254` | `mistakes` не существует в `SessionDebriefResponse`. | major | Удалить блок |
| 21 | `src/pages/Debrief.tsx:268` | `EventRow` получает `effects={ev.effects}` — `SessionEventItem` не имеет `effects`. Имеет `loyalty_after`, `safety_after`, `score_delta`. | major | Исправить передачу пропсов |
| 22 | `src/pages/Debrief.tsx:299-306` | `unlocked_achievements` не существует — в `SessionDebriefResponse` есть `achievements_unlocked`. | major | Заменить `unlocked_achievements` → `achievements_unlocked` |
| 23 | `src/pages/Play.tsx:39` | `initialSession` из `location.state` может быть `null`. `useState(initialSession?.loyalty ?? 100)` — при первом рендере OK, но `initialSession` может быть `null` при прямом переходе на /play без state. | major | Добавить проверку на `null` / дефолтные значения |
| 24 | `src/pages/Scenarios.tsx:94` | `scenario.best_score` может быть `null` или `undefined`. Выражение `scenario.best_score === null \|\| scenario.best_score === undefined` не покрывает `undefined` если `best_score` тип `number | null` (но `ScenarioItem` допускает `undefined`). При передаче в `difficultyLabel` тоже `difficulty` может быть `string | null | undefined`. | major | Уточнить типы |
| 25 | `src/api/index.ts:32` | `scenariosApi.list` вызывает `/scenarios/` (с `/` в конце), но контракт — `GET /api/v1/scenarios`. Backend может не резолвить trailing slash. | major | Убрать trailing slash: `/scenarios` |
| 26 | `src/pages/Debrief.tsx:268` | `key={`${ev.node_key}-${ev.created_at}-${i}`}` — `ev.created_at` строка, OK, но `EventRow` пропускает `created_at` (не передаёт). | minor | — |

### 🔵 MINOR (код-стайл, мёртвый код, мелкие накладки)

| # | Файл:строка | Суть | Серьёзность | Фикс |
|---|------------|------|------------|------|
| 27 | `src/pages/Achievements.tsx:1` | Импорт `Link` из react-router-dom не используется. | minor | Удалить |
| 28 | `src/App.tsx:5,7` | Импорт `AchievementsPage` и `LeaderboardPage` — оба роутят на несуществующие бэкенд-эндпоинты. | minor | Удалить или оставить с заглушками |
| 29 | `src/App.tsx:28` | Роут `/leaderboard` — эндпоинт не существует. | minor | Удалить роут |
| 30 | `src/App.tsx:27` | Роут `/profile/achievements` — эндпоинт не существует. | minor | Удалить роут |
| 31 | `src/components/AppLayout.tsx:35` | Навигационная ссылка на `/leaderboard` — dead link. | minor | Удалить ссылку |
| 32 | `src/pages/Profile.tsx:150-154` | Ссылка «Все ачивки» на `/profile/achievements` — dead link. | minor | Удалить ссылку |
| 33 | `src/pages/Register.tsx:3` | Импорт `getErrorMessage` из `../hooks/useAuth` — мёртвый импорт. | minor | Исправить на `../api/client` |
| 34 | `src/hooks/useTimer.ts:3` | Комментарий описывает формулу с `deadline - server_now`, но параметры не соответствуют. | minor | Обновить комментарий или код |
| 35 | `src/store/toastStore.ts:23` | `Math.random().toString(36).slice(2, 8)` — генерация ID через Math.random не уникальна при быстрых последовательных вызовах. | minor | Использовать `crypto.randomUUID()` или `Date.now() + Math.random()` |

---

## 3. МЁРТВЫЙ КОД

| Файл/Функция | Статус | Пояснение |
|---------------|--------|-----------|
| `src/pages/Leaderboard.tsx` | ❌ Мёртвый | `leaderboardApi` не существует, роут `/leaderboard` не имеет бэкенд-эндпоинта |
| `src/pages/Achievements.tsx` | ❌ Мёртвый | `profileApi.achievements` не существует, роут `/profile/achievements` не имеет бэкенд-эндпоинта |
| `src/components/AppLayout.tsx` ссылка на `/leaderboard` | ❌ Мёртвая ссылка | Навигация к несуществующему роуту |
| `src/pages/Profile.tsx` ссылка на `/profile/achievements` | ❌ Мёртвая ссылка | Навигация к несуществующему роуту |
| `src/pages/Register.tsx` импорт `getErrorMessage` из `useAuth` | ❌ Мёртвый импорт | `getErrorMessage` не экспортируется из `useAuth` |
| `src/components/ScoreBreakdown.tsx` | ❌ Мёртвый компонент | Используется только в `Debrief.tsx` с невалидными пропсами, вся секция «Разбор очков» сломана |
| `src/pages/Debrief.tsx` секции `score_breakdown`, `critical_decisions`, `mistakes` | ❌ Мёртвый UI | Полностью сломаны — референсятся к несуществующим полям |

---

## 4. ДУЛИКИ ТИПОВ, КОМПОНЕНТОВ, УТИЛИТ

| Что | Где | Пояснение |
|-----|------|-----------|
| `StatCard` и `FinalCard` | `Profile.tsx` vs `Debrief.tsx` | Оба — `card` с `label`/`value`. Можно вынести в общий компонент |
| `EmptyState` и `ErrorState` | — | Не дублируются, но паттерны похожи (card + кнопка) |
| `sessionStateLabel` / `sessionStateClass` | `format.ts` | Определены один раз, используются корректно |
| `signed()` | `effectsToast.ts` и `EventRow.tsx` | Дублируется — одна и та же функция в двух файлах |

---

## 5. РАСХОЖДЕНИЯ С BACKEND-КОНТРАКТОМ

| # | Что фронт делает | Что ожидает backend | Статус |
|---|-----------------|---------------------|--------|
| 1 | `scenariosApi.list` → `GET /scenarios/` | `GET /scenarios` (без слэша) | ❌ |
| 2 | `RegisterPage` → `register(email, password, displayName)` — 3 аргумента | `register(body: { email, password, display_name })` — 1 объект | ❌ |
| 3 | `ProtectedRoute` проверяет `token` из контекста | Контекст не содержит `token` | ❌ |
| 4 | `DebriefPage` обращается к `score_breakdown`, `critical_decisions`, `mistakes` | Нет таких полей; есть `events`, `competency_progress`, `achievements_unlocked`, `recommendations` | ❌ |
| 5 | `DebriefPage` использует `final.score/loyalty/safety/state` | Топ-level `final_score/loyalty/safety/state` | ❌ |
| 6 | `EventRow` ожидает `effects: { loyalty, safety, points }` | `SessionEventItem` имеет `loyalty_after, safety_after, score_delta` | ❌ |
| 7 | `ProfilePage` ожидает `stats`, `recent_sessions`, `achievements_preview` | `ProfileResponse` имеет `sessions_completed, sessions_failed, average_score, top_competencies` | ❌ |
| 8 | `LeaderboardPage` вызывает `leaderboardApi.get(50)` | Нет `leaderboardApi`, нет `/leaderboard` эндпоинта | ❌ |
| 9 | `AchievementsPage` вызывает `profileApi.achievements` | Нет `profileApi.achievements`, нет `/profile/achievements` эндпоинта | ❌ |
| 10 | `useTimer` передаёт числа вместо ISO-строк | Ожидает `deadline: string, serverNow: string` | ❌ |
| 11 | `Play.tsx` `handleTimeout` — `result.new_state !== 'active' || result.finished` | Должно `&&` для корректного редиректа | ❌ |
| 12 | `Debrief.tsx` `replayMutation` → `sessionsApi.create({ scenario_id: scenarioId })` | `create` ожидает `string` | ❌ |
| 13 | `EventRow.tsx` импортирует `EventType` из `types/api` | Тип `EventType` не определён | ❌ |
| 14 | `AchievementCard.tsx` импортирует `Achievement` из `types/api` | Тип `Achievement` не определён | ❌ |

---

## 6. ПРИОРИТЕТЫ ИСПРАВЛЕНИЯ

### Blocker (чинить первым, в первую очередь):

1. **#1-5**: Добавить недостающие типы (`ApiErrorBody`, `Achievement`, `EventType`, `Effects`, `SessionState`) в `types/api.ts`
2. **#6**: Исправить импорт `getErrorMessage` в `Register.tsx`
3. **#7**: Исправить вызов `register()` в `Register.tsx` — передать объект
4. **#8-9**: Удалить мёртвые страницы `Leaderboard` и `Achievements` (нет бэкенда)
5. **#10**: Исправить `ProtectedRoute.tsx` — убрать `token` из деструктуризации
6. **#11**: Переписать `Debrief.tsx` под реальную структуру `SessionDebriefResponse`

### Major (после blocker'ов):

7. **#12**: Исправить `useTimer` — принимать `timer_left_sec` (number) напрямую
8. **#13**: Исправить `||` → `&&` в `Play.tsx`
9. **#14-22**: Исправить `Debrief.tsx` полностью
10. **#23**: Дефолтные значения в `Play.tsx`
11. **#25**: Убрать trailing slash из `/scenarios/`

### Minor:

12. Все остальные — чистка импортов, удаление dead links, вынос `signed()`

---

## 7. ДОПОЛНИТЕЛЬНЫЕ ЗАМЕЧАНИЯ

- **`.env.local` содержит `VITE_USE_MOCK=false`** — нет `VITE_API_BASE_URL`, хотя `client.ts` читает `import.meta.env.VITE_API_BASE_URL`. Но `VITE_API_BASE_URL=/api/v1` установлен, а `.env.local` в `.gitignore` через `*.local`.
- **`public/` каталог пуст** — `public/mockServiceWorker.js` отсутствует (хорошо, MSW не нужен).
- **`tsconfig.json`** включает `noUnusedLocals`, `noUnusedParameters` — но `npm run build` падает с TS-ошибками до того, как доберётся до проверки неиспользуемого кода.
- **`AuthProvider` восстанавливает user через `GET /auth/me`** ✅ — соответствует контракту.
- **`logout` вызывает `queryClient.clear()`** ✅ — соответствует контракту.
- **`401 interceptor` вызывает `onUnauthorized`** ✅ — но `setUnauthorizedHandler` зарегистрирован в `AuthProvider`, который при логине сбрасывает user и токен.
- **`Register.tsx` форма** не имеет валидации `displayName` по длине (минимум 1 символ), но есть проверка `!displayName.trim()` — приемлемо.

---

*Отчёт подготовлен. Жду подтверждение для перехода к Этапу B.*
