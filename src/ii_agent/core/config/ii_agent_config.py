from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from ii_agent.utils.constants import TOKEN_BUDGET
# Constants
MAX_OUTPUT_TOKENS_PER_TURN = 32000
MAX_TURNS = 200



class AgentConfig(BaseModel):
    logs_path: str = Field(default="~/.ii_agent/logs")
    minimize_stdout_logs: bool = False
    docker_container_id: str = None
    needs_permission: bool = True
    max_output_tokens_per_turn: int = MAX_OUTPUT_TOKENS_PER_TURN
    max_turns: int = MAX_TURNS
    token_budget: int = TOKEN_BUDGET

class IIAgentConfig(BaseSettings):
    """
    Configuration for the IIAgent.

    Attributes:
        file_store: The type of file store to use.
        file_store_path: The path to the file store.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    file_store: str = Field(default="local")
    file_store_path: str = Field(default="~/.ii_agent/file_store")
    workspace_root: str = Field(default="~/.ii_agent/workspace")
    use_container_workspace: bool = Field(default=False)
    agent_config: AgentConfig = Field(default=AgentConfig())

