import asyncio
import json
from pathlib import Path

from app.core.security import hash_password
from app.models.achievement import Achievement
from app.models.base import SessionLocal
from app.models.choice import Choice
from app.models.competency import Competency
from app.models.group import Group
from app.models.notification import Notification
from app.models.scenario import Scenario
from app.models.scenario_competency import ScenarioCompetency
from app.models.scenario_node import ScenarioNode
from app.models.session_event import SessionEvent
from app.models.user import User
from app.models.user_achievement import UserAchievement
from app.models.user_competency_progress import UserCompetencyProgress
from sqlalchemy import delete, select

SEEDS = Path(__file__).parent / 'seeds'

COMPETENCIES = [
    ('communication', 'Коммуникация', 'Навык общения с пассажирами'),
    ('safety', 'Безопасность', 'Соблюдение протоколов безопасности'),
    ('service', 'Сервис', 'Качество обслуживания'),
    ('emergency', 'ЧС', 'Действия в нештатных ситуациях'),
    ('conflict_resolution', 'Конфликты', 'Разрешение конфликтных ситуаций'),
    ('teamwork', 'Команда', 'Взаимодействие с коллегами'),
]

SCENARIO_COMPETENCIES = {
    'medical-incident': {'emergency': 3, 'service': 2},
    'passenger-conflict': {'conflict_resolution': 3, 'safety': 2},
}


def load(name: str):
    with open(SEEDS / name, encoding='utf-8') as f:
        return json.load(f)


async def seed():
    async with SessionLocal() as db:
        print("Очистка БД...")
        try:
            await db.execute(delete(UserAchievement))
            await db.execute(delete(Choice))
            await db.execute(delete(ScenarioNode))
            await db.execute(delete(ScenarioCompetency))
            await db.execute(delete(Scenario))
            await db.execute(delete(Achievement))
            await db.execute(delete(UserCompetencyProgress))
            await db.execute(delete(Notification))
            await db.execute(delete(User))
            await db.execute(delete(Group))
            await db.commit()
            print("БД очищена")
        except Exception as e:
            print(f"Ошибка очистки (возможно таблицы пустые): {e}")
            await db.rollback()

        group = Group(id='vsm_default', name='ВСМ Дефолт', type='company')
        db.add(group)
        await db.flush()
        print(f"Создана группа: {group.id}")

        for code, title, desc in COMPETENCIES:
            db.add(Competency(code=code, title=title, description=desc))
        await db.flush()
        print(f"Создано компетенций: {len(COMPETENCIES)}")

        users_data = load('users.json')
        for u in users_data:
            db.add(User(
                email=u['email'],
                password_hash=hash_password(u['password']),
                display_name=u['display_name'],
                role=u['role'],
                group_id='vsm_default',
                total_score=u['total_score'],
            ))
        await db.flush()
        print(f"Создано пользователей: {len(users_data)}")

        achievements_data = load('achievements.json')
        for a in achievements_data:
            db.add(Achievement(
                code=a['code'],
                title=a['title'],
                description=a['description'],
                condition_code=a['condition_code'],
                icon=a['icon'],
                sort_order=a['sort_order'],
            ))
        await db.flush()
        print(f"Создано ачивок: {len(achievements_data)}")

        for fname in ('medical-incident.json', 'passenger-conflict.json'):
            data = load(fname)

            scenario = Scenario(
                id=data['scenario_id'],
                title=data['title'],
                description=data['description'],
                version=data['version'],
                difficulty=data['difficulty'],
                is_active=data['is_active'],
                start_node_key=data['start_node_key'],
            )
            db.add(scenario)
            await db.flush()
            print(f"Создан сценарий: {scenario.id}")

            for code, weight in SCENARIO_COMPETENCIES.get(data['scenario_id'], {}).items():
                db.add(ScenarioCompetency(
                    scenario_id=scenario.id,
                    competency_code=code,
                    weight=weight,
                ))

            for node in data['nodes']:
                db_node = ScenarioNode(
                    scenario_id=scenario.id,
                    node_key=node['node_key'],
                    type=node['type'],
                    node_text=node['text'],
                    timer_sec=node['timer_sec'],
                    is_start=(node['node_key'] == data['start_node_key']),
                )
                db.add(db_node)
                await db.flush()

                for ch in node['choices']:
                    db.add(Choice(
                        node_id=db_node.id,
                        choice_key=ch['choice_key'],
                        choice_text=ch['text'],
                        effects=ch['effects'],
                        next_node_key=ch['next_node_key'],
                        is_visible=ch['is_visible'],
                    ))

            await db.flush()
            print(f"  Узлов: {len(data['nodes'])}")

        await db.commit()
        print("✅ Сиды загружены успешно!")


if __name__ == '__main__':
    asyncio.run(seed())
