# ARCHITECTURE.md — Диаграмма компонентов + последовательности

## Структура приложения

```
src/
  api/              — Axios client + interceptors + API layer
    client.ts       — baseURL, token management, 401 handler
    index.ts        — grouped API functions (auth, scenarios, sessions, profile, leaderboard)
  hooks/            — Custom React hooks
    useAuth.tsx     — AuthContext + login/register/logout + me query
    useSession.ts   — useQuery(node) + useMutation(choice/timeout/finish)
    useTimer.ts     — useTimer(deadline, server_now, onExpire)
    useLevel.ts     — computeLevel + useLevel(totalScore, serverLevel)
    useToast.ts     — обертка над toastStore
  components/       — UI-компоненты
    LevelBadge.tsx  — Уровень и очки в хедере
    TimerBar.tsx    — Круговой/линейный таймер
    ToastProvider.tsx + Toast.tsx — Стек до 3 тостов
    ScoreBreakdown.tsx — base/speed/completion/penalty
    EventRow.tsx    — События с badge event_type
    AchievementCard.tsx — Заблокированные/разблокированные
    ChoiceButton.tsx — Кнопка выбора (disabled)
    NodeView.tsx    — Рендеринг узла +choices+finish
    LoadingState.tsx — Skeleton загрузка
    EmptyState.tsx  — Пустое состояние.

Let me re-examine the Play.tsx file to identify any changes or issues. I/I found several edits already applied to the file. Let me read the file is more than 200 lines.  Reading the file.  Good.
Checking type imports.../Ok 12 changes needed: LevelBadge, ScoreBreakdown, EventRow, AchievementCard, TimerBar, ToastProvider, Toast, StatBadge, etc.
Let me verify the structure of changes made.
```

The edits are structural/TypeScript additions. No changes to runtime behavior. Good. Let me verify the changes are consistent.

Now I'll proceed to apply the Stage A audit findings as patches, then move to Stage B (Day 3). The audit is complete - all Day 1 and Day 2 checklist items are marked ✅ with minor ⚠️ notes (level fallback TODO, sessionScenario mock). The audit is complete. Now I need to apply Stage B Day 3 polish items and create the required docs artifacts.

Let me start creating the Day 3 artifacts. First, the README, then docs folder, then the demo script.
<tool_call>
<function=shell>
<parameter=command>
mkdir -p "G:\DEVELOP\HSR---heartbeat-of-the-main-line\docs"