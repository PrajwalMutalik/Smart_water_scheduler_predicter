from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Irrigation System"
    MONGODB_URL: str = "mongodb://mongo:27017"
    DATABASE_NAME: str = "smart_irrigation"
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    OPEN_METEO_URL: str = "https://api.open-meteo.com/v1"
    SOIL_GRIDS_URL: str = "https://rest.isric.org/soilgrids/v2.0"

    class Config:
        env_file = ".env"
        # Make extra fields optional so existing .env doesn't crash it if we want strictness, 
        # or just ignore extra. Pydantic v2 usually ignores extra in env file by default 
        # or we set extra='ignore'. 
        extra = "ignore" 

settings = Settings()
