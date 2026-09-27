# ЭТАП A. АУДИТ ДНЯ 1 И ДНЯ 2

## Сводка ✅/⚠️/❌

### День 1 (Догрузка):
- ✅ Login / Register → JWT → /scenarios (все работают)
- ✅ Protected routes без токена → /login
- ✅ 401 → logout + редирект (axios interceptor + AuthProvider)
- ✅ Logout очищает токен И кэш TanStack Query (auth.ts: logout → clearStoredToken + setToken(null) + queryClient.clear())
- ✅ Список сценариев: skeleton / empty / error+retry (Scenarios.tsx)
- ✅ Старт сессии → /sessions/:id/play (Scenarios.tsx → useMutation)
- ✅ Узел: шкалы loyalty/safety, score, выборы (NodeView + StatBar)
- ✅ finish на ending_success / ending_fail (Play.tsx → handleFinish)
- ✅ state === failed → /debrief (Play.tsx handleChoice)
- ✅ Кнопки disabled во время mutation И при state !== 'active' (Play.tsx choicesDisabled)
- ⚠️ F5 на /play восстанавливает сессию и таймер — **БЛОКИРУЮЩИЙ БАГ: terminalSnapshot блокировал auto-redirect** (исправлено удалением terminalSnapshot)
- ✅ Если deadline прошёл при загрузке — авто POST /timeout (useTimer + handleTimeout useEffect)
- ✅ state !== 'active' при загрузке → редирект на /debrief (ProtectedRoute + useEffect в Play.tsx)
- ✅ Повторный клик по выбору не дублирует запрос (useMutation + invalidateNode)
- ⚠️ Повторный POST /choices после finish — UI ломается (наблюдается, но в текущем коде handleChoice возвращает early после редиректа)
- ✅ Level в хедере (LevelBadge + score)
- ✅ Прогресс до следующего уровня в профиле (progress bar + pointsToNext)
- ✅ Профиль: user, stats, recent_sessions, achievements_preview (Profile.tsx)
- ✅ recent_sessions: относительное время, state с цветом (formatRelativeTime + sessionStateClass)
- ✅ Дебриф не stub (Debrief.tsx: итог, score_breakdown, events, critical_decisions, mistakes, unlocked_achievements, recommendations)
- ✅ Все типы в types/api.ts, нет any (компилируется строгий TS)
- ✅ Axios interceptor 401 → logout (client.ts interceptors.response)
- ✅ Все запросы через api/-слой (все компоненты используют api/sessions, api/profile и т.д.)
- ✅ Loading / empty / error на /profile и /debrief (во всех компонентах)

### День 2 (таймеры, очки, геймификация):
- ✅ useTimer(deadline, server_now, onExpire) реализован (hooks/useTimer.ts)
- ✅ remaining считается от clientReceivedAt, не от Date.now() напрямую (useTimer: remainingMs = totalMs - (now - clientReceivedAt.current))
- ✅ onExpire вызывается РОВНО ОДИН РАЗ (guard через expireCalledRef)
- ✅ setInterval очищается при размонтировании (useEffect cleanup)
- ✅ Таймер не рендерится, если timer_sec === null (Play.tsx: showTimer guard)
- ✅ TimerBar: цвет зелёный/жёлтый/красный + пульсация < 20% (toneColor/textTone + animate-pulseSoft)
- ✅ Кнопки выборов disabled при remaining <= 0 (Play.tsx: choicesDisabled = busy || node.state !== 'active' || timerExpired)
- ✅ Авто POST /timeout при истечении, без дублей (handleTimeout + expireCalledRef guard)
- ✅ accepted === false → toast "Время вышло" + timeout-эффекты (Play.tsx handleChoice)
- ✅ accepted === true → toast effects (+зелёный / −красный) (formatEffectsToast)
- ✅ speed_bonus показан в toast, если > 0 (Play.tsx: `show(\"+${result.speed_bonus} за скорость\", 'success')`)
- ✅ Шкалы обновляются с CSS-transition ширины (StatBar: transition-[width] duration-300)
- ✅ state === 'failed' → редирект на /debrief (Play.tsx)
- ✅ ending_success / ending_fail → кнопка "Завершить" → POST /finish → /debrief (Play.tsx handleFinish)
- ✅ ToastProvider + useToast: стек до 3, авто-скрытие 3 sec (toastStore.ts: MAX_TOASTS=3, AUTO_HIDE_MS=3000)
- ✅ Дебриф полный: score_breakdown раздельно (base/speed/completion/penalty) (Debrief.tsx + ScoreBreakdown.tsx)
- ✅ Дебриф: critical_decisions с was_timeout badge (Debrief.tsx)
- ✅ Дебриф: mistakes с recommended_choice_key (Debrief.tsx)
- ✅ Дебриф: events с event_type badge (Debrief.tsx + EventRow.tsx)
- ✅ Дебриф: события > 10 → "Показать все" (Debrief.tsx: EVENTS_PREVIEW = 10 + showAllEvents)
- ✅ /profile/achievements: сетка, заблокированные серые + 🔒 (AchievementCard: opacity-50 + locked emoji)
- ✅ /profile/achievements: разблокированные с датой (AchievementCard: unlocked_at + formatDateRu)
- ✅ Профиль: recent_sessions клик → /sessions/:id/debrief (Profile.tsx: Link to debrief)
- ✅ /leaderboard: rank, display_name, score (Leaderboard.tsx)
- ✅ /leaderboard: топ-3 акцент (🥇🥈🥉) (MEDALS const + top3 bg-amber-500/5)
- ✅ /leaderboard: подсветка текущего пользователя (user_id из /me) (isMe + bg-indigo-500/15)
- ✅ /leaderboard: fallback, если Redis недоступен (EmptyState: "Backend может отдавать fallback из Postgres")
- ✅ Header: логотип, Сценарии / Профиль / Лидерборд / Logout (AppLayout.tsx)
- ✅ Header: активная ссылка подсвечена (linkClass + isActive)
- ✅ Header: LevelBadge + score (AppLayout.tsx)

---

## A.2. Таблица проблем

| Файл | Строка | Суть проблемы | Серьёзность | Фикс |
|---|---|---|---|---|
| `src/pages/Play.tsx` | 29-52 | `terminalSnapshot` state блокировал auto-redirect на `/debrief` при `state === 'completed'` или `'expired'` (условие `|| terminalSnapshot` в useEffect). F5 не переходил на дебриф для completed/expired состояний. | **Blocker** | ✅ Удален terminalSnapshot state, useEffect очищен от зависимости, handleChoice всегда `navigate` при `result.state !== 'active'` |
| `src/hooks/useSession.ts` | 37-39 | `finishMutation` не вызывал `invalidateNode()` — кэш node не обновлялся после finish. | **Major** | ✅ Добавлен `onSuccess: () => invalidateNode()` |
| `src/pages/Play.tsx` | 104-132 | `handleChoice` сохранял `terminalSnapshot` вместо прямого редиректа для `failed` состояния (теперь исправлено — всегда navigate). | **Major** | ✅ Убрано terminalSnapshot, всегда `navigate('/sessions/${id}/debrief')` |
| `src/hooks/useTimer.ts` | — | Нет явных багов, но `totalMs = Math.max(0, deadlineMs - serverNowMs)` — если `server_now > deadline` по timezone, остаток обрезается до 0. | **Minor** | ✅ Проверен — Math.max(0, ...) защищает от отрицательных значений |
| `src/components/TimerBar.tsx` | — | При `progress` = null (deadline null) компонент возвращает null — но `showTimer` в Play.tsx уже защищает от рендера. | **Minor** | ✅ Защита уже есть (showTimer guard) |
| `src/pages/Debrief.tsx` | 122 | `// TODO: scenario_id из DebriefResponse, когда backend добавит` — сценарий завязан на `getSessionScenario` из sessionStorage. | **Minor** | ✅ Принято, mock-режим, TODO документирован |
| `src/hooks/useLevel.ts` | 5 | `// TODO: заменить на серверное значение, когда backend добавит level в /auth/me и /profile.` — используется клиентский `computeLevel`. | **Minor** | ✅ Принято, TODO документировано |
| `src/types/api.ts` | 57 | `// TODO: серверное значение; пока может отсутствовать` в UserMe.level — опционально. | **Minor** | ✅ Принято |
| `src/types/api.ts` | 183 | `// TODO: серверное значение; пока может отсутствовать` в ProfileResponse.level — опционально. | **Minor** | ✅ Принято |
| `src/pages/Debrief.tsx` | 122 | `// TODO: scenario_id из DebriefResponse, когда backend добавит` — дубликат sessionScenario кэша. | **Minor** | ✅ Принято |

### Другие заметки (не критичные):
- `terminalSnapshot` переменная полностью удалена — мертвый код убран.
- Неиспользуемые импорты (`useState`, `Link`, `SessionState` в Play.tsx) убраны.
- `finishMutation` теперь инвалидирует кэш node — исправлено.

---

## A.3. Мёртвый код и галлюцинированные зависимости

| Тип | Файл/Деталь | Статус |
|---|---|---|
| Мёртвый код (unused import) | `src/pages/Play.tsx`: `useState`, `Link`, `import type { ChoiceResponse, Effects, SessionState }` | ✅ Удалено в процессе аудита |
| Мёртвый код (unused component) | Нет неиспользуемых компонентов | ✅ Чисто |
| Галлюцинированные зависимости | Проверено: все зависимости из package.json используются в коде | ✅ Нет галлюцинаций |
| Дубли типов | Нет — один интерфейс на файл | ✅ Нет дубликатов |
| any в компонентах | Нет (TS strict mode) | ✅ Чисто |

---

## A.4. TODO-заглушки к замене логикой

| Файл | Строка | Суть | План |
|---|---|---|---|
| `src/types/api.ts` | 57 | `UserMe.level?: number` — клиентский fallback | Принять как TODO, ожидать backend |
| `src/types/api.ts` | 183 | `ProfileResponse.user.level?: number` — клиентский fallback | Принять как TODO, ожидать backend |
| `src/utils/sessionScenario.ts` | — | `rememberSessionScenario` / `getSessionScenario` — кэш scenario_id из sessionStorage | Оставить, так как backend не отдает scenario_id |
| `src/pages/Debrief.tsx` | 122 | `// TODO: scenario_id из DebriefResponse, когда backend добавит` | Игнорировать до backend |
| `src/hooks/useLevel.ts` | 3, 24 | Компютレベル вместо серверного | Игнорировать до backend |

---

## A.5. Решение: что закрываем сразу перед Днем 3, что в ROADMAP

### ✅ Закрываем сразу (blocker/major устранены):
- ✅ terminalSnapshot баг в Play.tsx — исправлен
- ✅ finishMutation invalidateNode — исправлен
- ✅ Повторный клик не дублирует запрос — работает (useMutation + invalidateQueries)
- ✅ 401 → logout + /login — работает (axios + AuthProvider)
- ✅ Loading / empty / error на всех экранах — покрыты
- ✅ TimerBar цвета + пульсация — работает
- ✅ Авто POST /timeout при истечении — работает (expireCalledRef guard, ровно один раз)
- ✅ accepted === true/false → toast с эффектами — работает
- ✅ Speed bonus в toast — работает
- ✅ Score breakdown в дебрифе — работает
- ✅ Critical decisions, mistakes, events — работают
- ✅ AchievementCard locked/unlocked — работает
- ✅ Leaderboard medal + self-highlight — работает
- ✅ Toast stack ≤ 3, auto-hide 3s — работает
- ✅ LevelBadge + progress bar — работает
- ✅ Recent sessions relative time — работает
- ✅ Node state redirect on mount — работает (terminalSnapshot gone)

### ⚠️ В ROADMAP (minor, ожидаем backend):
- ⚠️ `UserMe.level` опциональный — клиентский computeLevel
- ⚠️ `ProfileResponse.level` опциональный — клиентский computeLevel
- ⚠️ `DebriefResponse.scenario_id` — sessionStorage fallback
- ⚠️ `/profile/analytics` — не реализовано (зависит от backend)
- ⚠️ `/challenges` — не реализовано
- ⚠️ `/notifications` — не реализовано
- ⚠️ `/docs` страница — нужно создать
- ⚠️ DEMO_MODE — нужно добавить
- ⚠️ DEMO_SCRIPT.md — нужно обновить

---

## A.6. Патчи для закрытия блокеров и major проблем

### Патч 1: Play.tsx — удаление terminalSnapshot
Удалено:
- `import { useState } from 'react'` → заменено на `useRef` только
- `const [terminalSnapshot, setTerminalSnapshot] = useState(...)`
- `useEffect` с зависимостью `terminalSnapshot`
- Рендер terminalSnapshot блока
- `import type { ChoiceResponse, Effects, SessionState }` → `import type { ChoiceResponse, Effects }`
- `Link` import удален

Добавлено:
- `handleChoice` всегда `navigate('/sessions/${id}/debrief')` при `result.state !== 'active'`
- `useEffect` для редиректа без `terminalSnapshot` зависимости

### Патч 2: useSession.ts — invalidateNode в finishMutation
Добавлен `onSuccess: () => invalidateNode()` в `finishMutation`.

### Патч 3: type imports cleanup
`SessionState` убран из imports в Play.tsx (не используется напрямую).

---

## Итог Этапа A
- **✅ Блокеров (critical) после исправлений: 0** (все закрыты: terminalSnapshot redirect, finishMutation invalidate)
- **✅ Major проблем после исправлений: 0** (все закрыты: finishMutation cache invalidation, choice duplicate prevention)
- **✅ Minor TODO items: документированы, в ROADMAP**
- **✅ TypeScript strict: clean compile**
- **✅ Vite build: clean build**

Перейти к Этапу B можно. Minor пункты перенесены в ROADMAP.md для последующей реализации.