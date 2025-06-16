from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from ii_agent.core.storage.models.settings import Settings
from ii_agent.core.storage.settings.settings_store import SettingsStore
from ii_agent.server.models.messages import GETSettingsModel
from ii_agent.server.settings import get_settings, get_settings_store


settings_router = APIRouter(prefix="/api", tags=["settings"])

@settings_router.get("/settings", 
    response_model=GETSettingsModel)
async def load_settings(
    settings: Settings = Depends(get_settings)
):

    if not settings:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={'error': 'Settings not found'},
        )

    # Check if any LLM config has an API key set
    llm_api_key_set = any(
        config.api_key is not None 
        for config in settings.llm_configs.values()
    ) if settings.llm_configs else False
    
    # Check if search config has an API key set
    search_api_key_set = (
        settings.search_config is not None and 
        hasattr(settings.search_config, 'api_key') and
        settings.search_config.api_key is not None
    )
    
    return GETSettingsModel(
        llm_api_key_set=llm_api_key_set,
        search_api_key_set=search_api_key_set,
        **settings.model_dump(exclude={'secrets_store'})
    )

async def store_llm_settings(
    settings: Settings, settings_store: SettingsStore
) -> Settings:
    existing_settings = await settings_store.load()

    # Convert to Settings model and merge with existing settings
    if existing_settings:
        # Keep existing LLM configs if not provided
        if not settings.llm_configs and existing_settings.llm_configs:
            settings.llm_configs = existing_settings.llm_configs
        elif settings.llm_configs and existing_settings.llm_configs:
            # Merge LLM configs, keeping existing ones if not overridden
            merged_configs = existing_settings.llm_configs.copy()
            merged_configs.update(settings.llm_configs)
            settings.llm_configs = merged_configs
        
        # Keep existing search config if not provided
        if settings.search_config is None and existing_settings.search_config:
            settings.search_config = existing_settings.search_config

    return settings


@settings_router.post("/settings",
    response_model=None)
async def store_settings(
    settings: Settings,
    settings_store: SettingsStore = Depends(get_settings_store)
):
    try:
        existing_settings = await settings_store.load()
        if existing_settings:
            # Keep existing LLM settings if not provided
            settings = await store_llm_settings(settings, settings_store)

        await settings_store.store(settings)

        return JSONResponse(content={"message": "Settings stored"}, status_code=status.HTTP_200_OK)
    except Exception as e:
        return JSONResponse(content={"message": f"Error storing settings: {e}"}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            