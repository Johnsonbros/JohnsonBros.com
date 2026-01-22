import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ThumbsUp, ThumbsDown, Download, RefreshCw, MessageSquare, 
  Bot, User, Clock, Database, Upload, Play, CheckCircle2, AlertCircle
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TrainingDataItem {
  id: number;
  sessionId: string;
  channel: string;
  userMessage: string;
  assistantResponse: string;
  conversationContext?: Array<{ role: string; content: string }>;
  toolsUsed?: string[];
  feedbackType: string;
  messageIndex?: number;
  exportedForTraining: boolean;
  createdAt: string;
}

interface TrainingDataResponse {
  success: boolean;
  data: TrainingDataItem[];
  total: number;
  stats: {
    positive: number;
    negative: number;
  };
}

export default function TrainingDataPage() {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [importUrls, setImportUrls] = useState("");
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery<TrainingDataResponse>({
    queryKey: ['/api/v1/chat/training-data', filter],
    queryFn: async () => {
      const url = filter === 'all' 
        ? '/api/v1/chat/training-data?limit=100'
        : `/api/v1/chat/training-data?feedbackType=${filter}&limit=100`;
      const res = await fetch(url);
      return res.json();
    }
  });

  const handleImport = async () => {
    if (!importUrls.trim()) return;
    const urls = importUrls.split('\n').map(u => u.trim()).filter(Boolean);
    try {
      await apiRequest('POST', '/api/v1/voice-training/import', { urls });
      toast({ title: "Import Started", description: `Started processing ${urls.length} recordings.` });
      setImportUrls("");
      refetchRecordings();
    } catch (error) {
      toast({ title: "Import Failed", description: "Failed to start import pipeline.", variant: "destructive" });
    }
  };

  const { data: recordings, refetch: refetchRecordings } = useQuery<any[]>({
    queryKey: ['/api/v1/voice-training/recordings'],
    queryFn: async () => {
      const res = await fetch('/api/v1/voice-training/recordings');
      return res.json();
    }
  });

  return (
    <>
      <SEO 
        title="Training Data | Admin"
        description="Review and export AI training data from customer feedback"
      />
      
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="w-6 h-6" />
              AI Training Data
            </h1>
            <p className="text-muted-foreground mt-1">
              Review customer feedback to fine-tune the AI assistant's personality
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={stats.positive === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export for Training
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                Positive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
              <p className="text-xs text-muted-foreground">Ready for training</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                <ThumbsDown className="w-4 h-4" />
                Negative
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
              <p className="text-xs text-muted-foreground">Review for improvements</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All Feedback</TabsTrigger>
            <TabsTrigger value="positive" className="text-green-600">
              <ThumbsUp className="w-4 h-4 mr-1" /> Positive
            </TabsTrigger>
            <TabsTrigger value="negative" className="text-red-600">
              <ThumbsDown className="w-4 h-4 mr-1" /> Negative
            </TabsTrigger>
            <TabsTrigger value="voice_import" className="flex items-center gap-2">
              <Upload className="w-4 h-4" /> Voice Pipeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice_import" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manual Audio Import</CardTitle>
                <CardDescription>Paste public audio URLs (one per line) to process through the transcription pipeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea 
                  className="w-full h-32 p-3 rounded-md border bg-background font-mono text-sm"
                  placeholder="https://example.com/call1.mp3&#10;https://example.com/call2.wav"
                  value={importUrls}
                  onChange={(e) => setImportUrls(e.target.value)}
                />
                <Button onClick={handleImport} disabled={!importUrls.trim()}>
                  <Play className="w-4 h-4 mr-2" /> Start Pipeline
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Imports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recordings?.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-3 rounded-md border">
                      <div className="flex items-center gap-3">
                        {rec.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : rec.status === 'failed' ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium truncate max-w-xs">{rec.recordingUrl}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {rec.twilioCallSid} • {format(new Date(rec.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={rec.status === 'completed' ? 'default' : 'secondary'}>
                        {rec.status}
                      </Badge>
                    </div>
                  ))}
                  {(!recordings || recordings.length === 0) && (
                    <p className="text-center py-8 text-muted-foreground">No recent voice imports</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value={filter} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : data?.data?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No feedback data yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customers can provide feedback by clicking thumbs up/down on AI responses
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {data?.data?.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardHeader className="py-3 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={item.feedbackType === 'positive' ? 'default' : 'destructive'}>
                              {item.feedbackType === 'positive' ? (
                                <><ThumbsUp className="w-3 h-3 mr-1" /> Positive</>
                              ) : (
                                <><ThumbsDown className="w-3 h-3 mr-1" /> Negative</>
                              )}
                            </Badge>
                            <Badge variant="outline">{item.channel}</Badge>
                            {item.toolsUsed && item.toolsUsed.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {item.toolsUsed.length} tool{item.toolsUsed.length > 1 ? 's' : ''} used
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-4 space-y-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Customer</p>
                            <p className="text-sm">{item.userMessage}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground mb-1">ZEKE (AI)</p>
                            <p className="text-sm whitespace-pre-wrap">{item.assistantResponse}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
