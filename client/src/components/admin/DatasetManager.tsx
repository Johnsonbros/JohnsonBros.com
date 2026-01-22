import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type VoiceDataset } from "@shared/schema";

export function DatasetManager() {
  const { data: datasets, isLoading } = useQuery<VoiceDataset[]>({
    queryKey: ["/api/v1/voice-training/datasets"],
  });

  if (isLoading) return <div>Loading datasets...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Training Datasets</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {datasets?.map((dataset) => {
          const progress = (dataset.currentCount / dataset.targetCount) * 100;
          return (
            <Card key={dataset.id}>
              <CardHeader>
                <CardTitle>{dataset.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{dataset.purpose}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{dataset.currentCount} / {dataset.targetCount} samples</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
