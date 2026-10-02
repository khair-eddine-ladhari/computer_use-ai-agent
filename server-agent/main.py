from fastapi import FastAPI
from api.routes.agent import router as agent_router

app = FastAPI()

app.include_router(agent_router, prefix="/api/agent")

@app.get("/health")
def health_check():
    return {"status": "ok"}