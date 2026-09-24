import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

/** Day 2: full debrief. Day 1 stub so failed sessions have a landing page. */
export function DebriefPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <EmptyState
        title="Дебриф появится в День 2"
        description={
          id
            ? `Сессия ${id} завершена. Полный разбор будет доступен на следующем этапе.`
            : 'Сессия завершена.'
        }
        actionLabel="К сценариям"
        onAction={() => navigate('/scenarios')}
      />
      <div className="text-center">
        <Link to="/scenarios" className="text-sm text-indigo-400 hover:text-indigo-300">
          Вернуться к сценариям
        </Link>
      </div>
    </div>
  );
}
