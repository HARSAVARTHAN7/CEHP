import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CEHP Academic AI Service"
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    DEBUG: bool = False
    
    # AI Providers / Keys
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    FALLBACK_TO_RULES: bool = True
    
    # Backend URL for verification if needed
    BACKEND_URL: str = "http://localhost:5000/api/v1"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
