'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Cpu, Check } from 'lucide-react';
import { api } from '@/lib/api';

interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
}

interface ModelsResponse {
  models: Model[];
  current: string;
}

const providerLabels: Record<string, string> = {
  google: 'Google Gemini',
};

export function ModelSelector() {
  const [models, setModels] = useState<Model[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const data = await api.get<ModelsResponse>('/api/v1/settings/models');
      setModels(data.models);
      setCurrentModel(data.current);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const selectModel = async (modelId: string) => {
    setLoading(true);
    try {
      await api.put('/api/v1/settings/models', { model_id: modelId });
      setCurrentModel(modelId);
    } catch (error) {
      console.error('Failed to update model:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentModelInfo = models.find((m) => m.id === currentModel);

  // プロバイダーでグループ化
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  const providers = Object.keys(groupedModels);

  // モデルが1つ以下の場合はセレクターを非表示
  if (models.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          <Cpu className="h-4 w-4 mr-2" />
          {currentModelInfo?.name || 'Model'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {providers.map((provider, index) => (
          <div key={provider}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {providerLabels[provider] || provider}
            </DropdownMenuLabel>
            {groupedModels[provider].map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => selectModel(model.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-muted-foreground">{model.description}</div>
                </div>
                {model.id === currentModel && (
                  <Check className="h-4 w-4 text-primary ml-2" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
