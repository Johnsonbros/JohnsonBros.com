import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Database, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { type VoiceDataset } from "@shared/schema";

export function DatasetManager() {
  const { toast } = useToast();
  const [primaryModel, setPrimaryModel] = useState("gpt-4o");

  const { data: datasets, isLoading: datasetsLoading } = useQuery<VoiceDataset[]>({
    queryKey: ["/api/v1/voice-training/datasets"],
  });

  const { data: modelSetting } = useQuery({
    queryKey: ['/api/v1/system/settings/ai_models'],
  });

  useEffect(() => {
    if (modelSetting?.value?.primaryModel) {
      setPrimaryModel(modelSetting.value.primaryModel);
    }
  }, [modelSetting]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (value: any) => {
      await apiRequest('POST', '/api/v1/system/settings', { key: 'ai_models', value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/system/settings/ai_models'] });
      toast({ title: "Settings updated", description: "Global AI model settings have been saved." });
    }
  });

  if (datasetsLoading) return <div className="flex items-center justify-center p-8 text-sm text-muted-foreground italic">Loading datasets...</div>;

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-johnson-orange bg-slate-50/50 dark:bg-slate-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-johnson-orange" /> Global AI Model Configuration
              </CardTitle>
              <CardDescription>Select the default models for transcription, analysis, and fine-tuning.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Primary LLM Model (Global)</Label>
              <Select value={primaryModel} onValueChange={setPrimaryModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (Standard)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                  <SelectItem value="ft:gpt-4o:johnson-bros:v1">Nate Custom V1 (Fine-tuned)</SelectItem>
                  <SelectItem value="ft:gpt-4o:johnson-bros:v2">Nate Custom V2 (Development)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground italic">
                Updating this will immediately affect all new transcription and analysis tasks.
              </p>
            </div>
          </div>
          <Button 
            className="w-full sm:w-auto bg-ジョンソンオレンジ hover:bg-ジョンソンオレンジ/90"
            onClick={() => updateSettingsMutation.mutate({ primaryModel })}
            disabled={updateSettingsMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" /> Save Global Settings
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Training Datasets</h2>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" /> New Dataset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {datasets?.map((dataset) => {
          const progress = (dataset.currentCount / dataset.targetCount) * 100;
          return (
            <Card key={dataset.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Database className="h-4 w-4 text-blue-500" />
                    {dataset.name}
                  </CardTitle>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    dataset.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {dataset.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{dataset.purpose}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Progress</span>
                    <span>{dataset.currentCount} / {dataset.targetCount} samples</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
