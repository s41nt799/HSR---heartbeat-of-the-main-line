import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getErrorMessage, useAuth } from '../hooks/useAuth';
import { isValidEmail } from '../utils/format';

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/scenarios" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Укажите отображаемое имя');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Введите корректный email');
      return;
    }
    if (password.length < 8) {
      setError('Пароль должен быть не короче 8 символов');
      return;
    }

    setSubmitting(true);
    try {
      await register(email.trim(), password, displayName.trim());
      navigate('/scenarios', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось зарегистрироваться'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-100">Регистрация</h1>
        <p className="mt-2 text-sm text-slate-400">Создайте аккаунт проводника</p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="display_name">
            Имя
          </label>
          <input
            id="display_name"
            className="input"
            type="text"
            autoComplete="nickname"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Пароль
          </label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        <button type="submit" className="btn w-full" disabled={submitting}>
          {submitting ? 'Создание…' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-400">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
          Войти
        </Link>
      </p>
    </div>
  );
}
