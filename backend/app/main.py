from fastapi import FastAPI

from .api.v1.router import api_routers

app = FastAPI(
    title='Геймифицированный тренажёр для проводников ВСМ',
    description='API обучающего тренажёра сценариев для проводников ВСМ',
    version='0.1.0',
)

app.include_router(api_routers)


@app.get('/health', tags=['Summary'])
async def health():
    return {'status': 'ok'}
