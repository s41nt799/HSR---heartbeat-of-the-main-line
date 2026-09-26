import type { Achievement } from '../types/api';
import { formatDateRu } from '../utils/format';

interface AchievementCardProps {
  achievement: Achievement;
  /** Анимация появления (дебриф) */
  animate?: boolean;
  animationDelayMs?: number;
}

export function AchievementCard({
  achievement,
  animate = false,
  animationDelayMs = 0,
}: AchievementCardProps) {
  // unlocked === true или animate (свежая ачивка в дебрифе)
  const isUnlocked = animate || achievement.unlocked === true;

  return (
    <div
      className={`card ${isUnlocked ? '' : 'opacity-50'} ${
        animate ? 'animate-achievementIn border-amber-500/30 bg-amber-500/10' : ''
      }`}
      style={animate ? { animationDelay: `${animationDelayMs}ms` } : undefined}
    >
      <div className="text-2xl" aria-hidden>
        {isUnlocked ? '🏅' : '🔒'}
      </div>
      <div className={`mt-2 font-medium ${isUnlocked ? 'text-slate-100' : 'text-slate-400'}`}>
        {achievement.title}
      </div>
      {achievement.description && (
        <p className="mt-1 text-xs text-slate-400">{achievement.description}</p>
      )}
      {isUnlocked && achievement.unlocked_at && (
        <p className="mt-2 text-xs text-emerald-400/80">
          {formatDateRu(achievement.unlocked_at)}
        </p>
      )}
    </div>
  );
}
