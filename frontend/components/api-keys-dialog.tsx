import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAppContext } from "@/context/app-context";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LLMConfig } from "@/typings/agent";

interface ApiKeysDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define available models for each provider
const PROVIDER_MODELS = {
  anthropic: [
    "claude-sonnet-4@20250514",
    "claude-opus-4@20250514",
    "claude-3-7-sonnet@20250219",
  ],
  openai: [
    "gpt-4-turbo",
    "gpt-4-1106-preview",
    "gpt-4",
    "gpt-3.5-turbo",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-4.5",
    "o3",
    "o3-mini",
    "o3-pro",
    "o4-mini",
    "custom", // Add custom option for OpenAI
  ],
  gemini: [
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
  ],
};

const ApiKeysDialog = ({ isOpen, onClose }: ApiKeysDialogProps) => {
  const { dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState("llm-config");
  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [selectedModel, setSelectedModel] = useState(
    PROVIDER_MODELS.anthropic[0]
  );
  const [customModelName, setCustomModelName] = useState("");

  const [llmConfig, setLlmConfig] = useState<{
    [key: string]: LLMConfig;
  }>({});

  const [searchConfig, setSearchConfig] = useState({
    firecrawl_api_key: "",
    firecrawl_base_url: "",
    serpapi_api_key: "",
    tavily_api_key: "",
    jina_api_key: "",
  });

  const [mediaConfig, setMediaConfig] = useState({
    gcp_project_id: "",
    gcp_location: "",
    gcs_output_bucket: "",
  });

  const [audioConfig, setAudioConfig] = useState({
    openai_api_key: "",
    azure_endpoint: "",
    azure_api_version: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settings`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      // Update state with fetched settings
      if (data.llm_configs) {
        setLlmConfig(data.llm_configs);

        // Set selected provider and model based on first available config
        const modelEntries: [string, LLMConfig][] = Object.entries(
          data.llm_configs
        );
        if (modelEntries.length > 0) {
          const [firstModelName, firstModelConfig] = modelEntries[0];
          const provider = firstModelConfig.api_type || "anthropic";

          setSelectedProvider(provider);
          setSelectedModel(firstModelName);

          // Update available models in app context
          const availableModelNames = Object.keys(data.llm_configs);
          dispatch({
            type: "SET_AVAILABLE_MODELS",
            payload: availableModelNames,
          });
        }
      }

      if (data.search_config) {
        setSearchConfig({
          firecrawl_api_key: data.search_config.firecrawl_api_key || "",
          firecrawl_base_url: data.search_config.firecrawl_base_url || "",
          serpapi_api_key: data.search_config.serpapi_api_key || "",
          tavily_api_key: data.search_config.tavily_api_key || "",
          jina_api_key: data.search_config.jina_api_key || "",
        });
      }

      if (data.media_config) {
        setMediaConfig({
          gcp_project_id: data.media_config.gcp_project_id || "",
          gcp_location: data.media_config.gcp_location || "",
          gcs_output_bucket: data.media_config.gcs_output_bucket || "",
        });
      }

      if (data.audio_config) {
        setAudioConfig({
          openai_api_key: data.audio_config.openai_api_key || "",
          azure_endpoint: data.audio_config.azure_endpoint || "",
          azure_api_version: data.audio_config.azure_api_version || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update selected model when provider changes
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    setSelectedModel(
      PROVIDER_MODELS[provider as keyof typeof PROVIDER_MODELS][0]
    );
    setCustomModelName(""); // Reset custom model name when provider changes
  };

  // Handle model selection
  const handleModelChange = (model: string) => {
    setSelectedModel(model);

    // If not custom model, ensure the model config exists
    if (model !== "custom") {
      if (!llmConfig[model]) {
        setLlmConfig({
          ...llmConfig,
          [model]: {
            api_key: "",
            base_url: "",
            api_type: selectedProvider,
          },
        });
      }
    } else {
      // For custom model, ensure the "custom" key exists in llmConfig
      if (!llmConfig["custom"]) {
        setLlmConfig({
          ...llmConfig,
          custom: {
            api_key: "",
            base_url: "",
            api_type: selectedProvider,
            model_name: "",
          },
        });
      }
    }
  };

  // Handle custom model name change
  const handleCustomModelNameChange = (name: string) => {
    setCustomModelName(name);

    // Update the model_name field in the custom config
    setLlmConfig({
      ...llmConfig,
      custom: {
        ...(llmConfig["custom"] || {}),
        model_name: name,
        api_type: selectedProvider,
      },
    });
  };

  const handleLlmConfigChange = (model: string, key: string, value: string) => {
    setLlmConfig({
      ...llmConfig,
      [model]: {
        ...(llmConfig[model] || {}),
        [key]: value,
        api_type: selectedProvider,
      },
    });
  };

  const handleSearchConfigChange = (key: string, value: string) => {
    setSearchConfig({
      ...searchConfig,
      [key]: value,
    });
  };

  const handleMediaConfigChange = (key: string, value: string) => {
    setMediaConfig({
      ...mediaConfig,
      [key]: value,
    });
  };

  const handleAudioConfigChange = (key: string, value: string) => {
    setAudioConfig({
      ...audioConfig,
      [key]: value,
    });
  };

  const saveConfig = async () => {
    try {
      setIsSaving(true);

      // Combine all configs
      const configData = {
        llm_configs: llmConfig,
        search_config: searchConfig,
        media_config: mediaConfig,
        audio_config: audioConfig,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(configData),
        }
      );

      if (response.ok) {
        // Update available models in app context after saving
        const availableModelNames = Object.keys(llmConfig);
        dispatch({
          type: "SET_AVAILABLE_MODELS",
          payload: availableModelNames,
        });

        toast.success("Configuration saved successfully");
        onClose();
      } else {
        throw new Error("Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Failed to save configuration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1f23] border-[#3A3B3F] text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Configuration
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure your LLM providers and API keys for various services.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4 w-full">
                <TabsTrigger value="llm-config">LLM</TabsTrigger>
                <TabsTrigger value="search-config">Search</TabsTrigger>
                <TabsTrigger value="media-config">Media</TabsTrigger>
                <TabsTrigger value="audio-config">Audio</TabsTrigger>
              </TabsList>

              <TabsContent value="llm-config" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="llm-provider">LLM Provider</Label>
                  <Select
                    value={selectedProvider}
                    onValueChange={handleProviderChange}
                  >
                    <SelectTrigger className="bg-[#35363a] border-[#ffffff0f] w-full">
                      <SelectValue placeholder="Select LLM Provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#35363a] border-[#ffffff0f]">
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={handleModelChange}
                  >
                    <SelectTrigger className="bg-[#35363a] border-[#ffffff0f] w-full">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#35363a] border-[#ffffff0f]">
                      {PROVIDER_MODELS[
                        selectedProvider as keyof typeof PROVIDER_MODELS
                      ].map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show custom model input field when "custom" is selected for OpenAI */}
                {selectedProvider === "openai" &&
                  selectedModel === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-model-name">
                        Custom Model Name
                      </Label>
                      <Input
                        id="custom-model-name"
                        type="text"
                        value={customModelName}
                        onChange={(e) =>
                          handleCustomModelNameChange(e.target.value)
                        }
                        placeholder="Enter custom model name"
                        className="bg-[#35363a] border-[#ffffff0f]"
                      />
                    </div>
                  )}

                {selectedProvider === "anthropic" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={llmConfig[selectedModel]?.api_key || ""}
                        onChange={(e) =>
                          handleLlmConfigChange(
                            selectedModel,
                            "api_key",
                            e.target.value
                          )
                        }
                        placeholder="Enter API Key"
                        className="bg-[#35363a] border-[#ffffff0f]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="base-url">Base URL (Optional)</Label>
                      <Input
                        id="base-url"
                        type="text"
                        value={llmConfig[selectedModel]?.base_url || ""}
                        onChange={(e) =>
                          handleLlmConfigChange(
                            selectedModel,
                            "base_url",
                            e.target.value
                          )
                        }
                        placeholder="Enter Base URL (if using a proxy)"
                        className="bg-[#35363a] border-[#ffffff0f]"
                      />
                    </div>
                  </div>
                )}

                {selectedProvider === "openai" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={
                          llmConfig[
                            selectedModel === "custom"
                              ? customModelName
                              : selectedModel
                          ]?.api_key || ""
                        }
                        onChange={(e) =>
                          handleLlmConfigChange(
                            selectedModel === "custom"
                              ? customModelName
                              : selectedModel,
                            "api_key",
                            e.target.value
                          )
                        }
                        placeholder="Enter API Key"
                        className="bg-[#35363a] border-[#ffffff0f]"
                        disabled={
                          selectedModel === "custom" && !customModelName.trim()
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="base-url">Base URL (Optional)</Label>
                      <Input
                        id="base-url"
                        type="text"
                        value={
                          llmConfig[
                            selectedModel === "custom"
                              ? customModelName
                              : selectedModel
                          ]?.base_url || ""
                        }
                        onChange={(e) =>
                          handleLlmConfigChange(
                            selectedModel === "custom"
                              ? customModelName
                              : selectedModel,
                            "base_url",
                            e.target.value
                          )
                        }
                        placeholder="Enter Base URL (if using a proxy)"
                        className="bg-[#35363a] border-[#ffffff0f]"
                        disabled={
                          selectedModel === "custom" && !customModelName.trim()
                        }
                      />
                    </div>
                  </div>
                )}

                {selectedProvider === "gemini" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={llmConfig[selectedModel]?.api_key || ""}
                        onChange={(e) =>
                          handleLlmConfigChange(
                            selectedModel,
                            "api_key",
                            e.target.value
                          )
                        }
                        placeholder="Enter API Key"
                        className="bg-[#35363a] border-[#ffffff0f]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vertex-region">
                        Vertex Region (Optional)
                      </Label>
                      <Input
                        id="vertex-region"
                        type="text"
                        value={llmConfig[selectedModel]?.vertex_region || ""}
                        onChange={(e) =>
                          handleLlmConfigChange(
                            selectedModel,
                            "vertex_region",
                            e.target.value
                          )
                        }
                        placeholder="Enter Vertex Region (for Vertex AI)"
                        className="bg-[#35363a] border-[#ffffff0f]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vertex-project-id">
                        Vertex Project ID (Optional)
                      </Label>
                      <Input
                        id="vertex-project-id"
                        type="text"
                        value={
                          llmConfig[selectedModel]?.vertex_project_id || ""
                        }
                        onChange={(e) =>
                          handleLlmConfigChange(
                            selectedModel,
                            "vertex_project_id",
                            e.target.value
                          )
                        }
                        placeholder="Enter Vertex Project ID (for Vertex AI)"
                        className="bg-[#35363a] border-[#ffffff0f]"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="search-config" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firecrawl-key">FireCrawl API Key</Label>
                  <Input
                    id="firecrawl-key"
                    type="password"
                    value={searchConfig.firecrawl_api_key}
                    onChange={(e) =>
                      handleSearchConfigChange(
                        "firecrawl_api_key",
                        e.target.value
                      )
                    }
                    placeholder="Enter FireCrawl API Key"
                    className="bg-[#35363a] border-[#ffffff0f]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firecrawl-base-url">FireCrawl Base URL</Label>
                  <Input
                    id="firecrawl-base-url"
                    type="text"
                    value={searchConfig.firecrawl_base_url}
                    onChange={(e) =>
                      handleSearchConfigChange(
                        "firecrawl_base_url",
                        e.target.value
                      )
                    }
                    placeholder="Enter FireCrawl Base URL"
                    className="bg-[#35363a] border-[#ffffff0f]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serpapi-key">SerpAPI API Key</Label>
                  <Input
                    id="serpapi-key"
                    type="password"
                    value={searchConfig.serpapi_api_key}
                    onChange={(e) =>
                      handleSearchConfigChange(
                        "serpapi_api_key",
                        e.target.value
                      )
                    }
                    placeholder="Enter SerpAPI API Key"
                    className="bg-[#35363a] border-[#ffffff0f]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tavily-key">Tavily API Key</Label>
                  <Input
                    id="tavily-key"
                    type="password"
                    value={searchConfig.tavily_api_key}
                    onChange={(e) =>
                      handleSearchConfigChange("tavily_api_key", e.target.value)
                    }
                    placeholder="Enter Tavily API Key"
                    className="bg-[#35363a] border-[#ffffff0f]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jina-key">Jina API Key</Label>
                  <Input
                    id="jina-key"
                    type="password"
                    value={searchConfig.jina_api_key}
                    onChange={(e) =>
                      handleSearchConfigChange("jina_api_key", e.target.value)
                    }
                    placeholder="Enter Jina API Key"
                    className="bg-[#35363a] border-[#ffffff0f]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="media-config" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gcp-project-id">GCP Project ID</Label>
                  <Input
                    id="gcp-project-id"
                    type="text"
                    value={mediaConfig.gcp_project_id}
                    onChange={(e) =>
                      handleMediaConfigChange("gcp_project_id", e.target.value)
                    }
                    placeholder="Enter Google Cloud Project ID"
                    className="bg-[#35363a] border-[#ffffff0f]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gcp-location">GCP Location</Label>
                  <Input
                    id="gcp-location"
                    type="text"
                    value={mediaConfig.gcp_location}
                    onChange={(e) =>
                      handleMediaConfigChange("gcp_location", e.target.value)
                    }
                    placeholder="Enter Google Cloud location/region"
                    className="bg-[#35363a] border-[#ffffff0f]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gcs-output-bucket">GCS Output Bucket</Label>
                  <Input
                    id="gcs-output-bucket"
                    type="text"
                    value={mediaConfig.gcs_output_bucket}
                    onChange={(e) =>
                      handleMediaConfigChange(
                        "gcs_output_bucket",
                        e.target.value
                      )
                    }
                    placeholder="Enter GCS bucket URI (e.g., gs://my-bucket-name)"
                    className="bg-[#35363a] border-[#ffffff0f]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="audio-config" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="audio-openai-key">OpenAI API Key</Label>
                  <Input
                    id="audio-openai-key"
                    type="password"
                    value={audioConfig.openai_api_key}
                    onChange={(e) =>
                      handleAudioConfigChange("openai_api_key", e.target.value)
                    }
                    placeholder="Enter OpenAI API Key for audio services"
                    className="bg-[#35363a] border-[#ffffff0f]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="azure-endpoint">Azure Endpoint</Label>
                  <Input
                    id="azure-endpoint"
                    type="text"
                    value={audioConfig.azure_endpoint}
                    onChange={(e) =>
                      handleAudioConfigChange("azure_endpoint", e.target.value)
                    }
                    placeholder="Enter Azure OpenAI endpoint"
                    className="bg-[#35363a] border-[#ffffff0f]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="azure-api-version">Azure API Version</Label>
                  <Input
                    id="azure-api-version"
                    type="text"
                    value={audioConfig.azure_api_version}
                    onChange={(e) =>
                      handleAudioConfigChange(
                        "azure_api_version",
                        e.target.value
                      )
                    }
                    placeholder="Enter Azure API version"
                    className="bg-[#35363a] border-[#ffffff0f]"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-[#ffffff0f] h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={saveConfig}
                className="bg-gradient-skyblue-lavender"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Configuration"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeysDialog;
