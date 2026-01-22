import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageSquare, Phone, Mail, Bot, User, Wrench, Clock, 
  CheckCircle, XCircle, AlertTriangle, Download, RefreshCw,
  Star, Flag, ThumbsUp, ThumbsDown, FileText, Activity, Search
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

interface AgentConversation {
  id: number;
  sessionId: string;
  channel: string;
  customerPhone?: string;
  customerId?: number;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    toolCalls?: Array<{ id: string; name: string; arguments: any }>;
    toolCallId?: string;
  }>;
  outcome?: string;
  totalTokens?: number;
  totalToolCalls?: number;
  startedAt: string;
  endedAt?: string;
}

interface AgentToolCall {
  id: number;
  conversationId: number;
  toolName: string;
  toolCallId: string;
  arguments: Record<string, any>;
  result?: any;
  success: boolean;
  errorMessage?: string;
  latencyMs?: number;
  userMessageTrigger?: string;
  wasCorrectTool?: boolean;
  correctToolSuggestion?: string;
  createdAt: string;
}

interface AgentFeedback {
  id: number;
  conversationId: number;
  toolCallId?: number;
  messageIndex?: number;
  feedbackType: string;
  rating?: number;
  correctedResponse?: string;
  flagReason?: string;
  annotation?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

interface ConversationStats {
  totalConversations: number;
  byChannel: Record<string, number>;
  byOutcome: Record<string, number>;
  avgToolCallsPerConversation: number;
  avgMessagesPerConversation: number;
}

interface ToolCallStats {
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  byTool: Record<string, { count: number; successRate: number; avgLatency: number }>;
}

export default function AgentTracingPage() {
  const { toast } = useToast();
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [selectedOutcome, setSelectedOutcome] = useState<string>("all");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedToolCall, setSelectedToolCall] = useState<AgentToolCall | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    feedbackType: 'rating',
    rating: 5,
    annotation: '',
    correctedResponse: '',
  });
  const [toolReviewData, setToolReviewData] = useState({
    wasCorrectTool: true,
    correctToolSuggestion: '',
    flagReason: '',
    annotation: '',
  });

  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
    conversations: ConversationStats;
    toolCalls: ToolCallStats;
  }>({
    queryKey: ['/api/admin/agent-tracing/stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agent-tracing/stats', authHeaders);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const { data: conversations, isLoading: conversationsLoading, refetch: refetchConversations } = useQuery<AgentConversation[]>({
    queryKey: ['/api/admin/agent-tracing/conversations', selectedChannel, selectedOutcome, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedChannel !== 'all') params.append('channel', selectedChannel);
      if (selectedOutcome !== 'all') params.append('outcome', selectedOutcome);
      if (searchTerm) params.append('search', searchTerm);
      const res = await fetch(`/api/admin/agent-tracing/conversations?${params.toString()}`, authHeaders);
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
  });

  const { data: conversationDetails, isLoading: detailsLoading } = useQuery<{
    conversation: AgentConversation;
    toolCalls: AgentToolCall[];
    feedback: AgentFeedback[];
  }>({
    queryKey: ['/api/admin/agent-tracing/conversations', selectedConversation],
    queryFn: async () => {
      const res = await fetch(`/api/admin/agent-tracing/conversations/${selectedConversation}`, authHeaders);
      if (!res.ok) throw new Error('Failed to fetch conversation details');
      return res.json();
    },
    enabled: !!selectedConversation,
  });

  const { data: exportPreview } = useQuery<{
    totalExamples: number;
    preview: Array<{ messages: any[] }>;
  }>({
    queryKey: ['/api/admin/agent-tracing/export/preview'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agent-tracing/export/preview', authHeaders);
      if (!res.ok) throw new Error('Failed to fetch export preview');
      return res.json();
    },
  });

  const addFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/agent-tracing/conversations/${selectedConversation}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add feedback');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Feedback added", description: "Your feedback has been saved." });
      setFeedbackDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agent-tracing/conversations', selectedConversation] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add feedback.", variant: "destructive" });
    },
  });

  const reviewToolCallMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/agent-tracing/tool-calls/${selectedToolCall?.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save review');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Review saved", description: "Tool call has been reviewed." });
      setReviewDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agent-tracing/conversations', selectedConversation] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save review.", variant: "destructive" });
    },
  });

  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/agent-tracing/export/fine-tuning', authHeaders);
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fine-tuning-${new Date().toISOString().split('T')[0]}.jsonl`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Export successful", description: "Fine-tuning data has been downloaded." });
    } catch (error) {
      toast({ title: "Export failed", description: "Unable to export data.", variant: "destructive" });
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'web_chat': return <MessageSquare className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'voice': return <Phone className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'web_chat': return 'bg-blue-500';
      case 'sms': return 'bg-green-500';
      case 'voice': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome) {
      case 'completed': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
      case 'abandoned': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Abandoned</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Error</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">In Progress</Badge>;
    }
  };

  const handleRefresh = () => {
    refetchStats();
    refetchConversations();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" data-testid="agent-tracing-page">
      <SEO 
        title="Agent Tracing - Admin Dashboard"
        description="View and analyze AI agent conversations, tool usage, and feedback"
      />
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Tracing</h1>
            <p className="text-gray-500 dark:text-gray-400">Monitor AI conversations and capture training data</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export for Fine-tuning
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-total-conversations">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData?.conversations.totalConversations || 0}</div>
              <p className="text-xs text-muted-foreground">
                Avg {(statsData?.conversations.avgMessagesPerConversation || 0).toFixed(1)} messages each
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-tool-calls">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tool Calls</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData?.toolCalls.totalCalls || 0}</div>
              <p className="text-xs text-muted-foreground">
                {(statsData?.toolCalls.successRate || 0).toFixed(1)}% success rate
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-latency">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(statsData?.toolCalls.avgLatencyMs || 0).toFixed(0)}ms</div>
              <p className="text-xs text-muted-foreground">Tool execution time</p>
            </CardContent>
          </Card>

          <Card data-testid="card-training-examples">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Examples</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exportPreview?.totalExamples || 0}</div>
              <p className="text-xs text-muted-foreground">Ready for fine-tuning</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statsData?.conversations.byChannel && Object.entries(statsData.conversations.byChannel).map(([channel, count]) => (
            <Card key={channel} data-testid={`card-channel-${channel}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getChannelColor(channel)}`}>
                    {getChannelIcon(channel)}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{channel.replace('_', ' ')}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="conversations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="conversations" data-testid="tab-conversations">Conversations</TabsTrigger>
            <TabsTrigger value="tools" data-testid="tab-tools">Tool Usage</TabsTrigger>
            <TabsTrigger value="export" data-testid="tab-export">Export Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle>Conversation History</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search messages..." 
                        className="pl-8 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                      <SelectTrigger className="w-[150px]" data-testid="select-channel">
                        <SelectValue placeholder="Channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        <SelectItem value="web_chat">Web Chat</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="voice">Voice</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
                      <SelectTrigger className="w-[150px]" data-testid="select-outcome">
                        <SelectValue placeholder="Outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Outcomes</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="abandoned">Abandoned</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ScrollArea className="h-[600px] rounded-md border p-4">
                    {conversationsLoading ? (
                      <p className="text-center text-muted-foreground">Loading...</p>
                    ) : conversations?.length === 0 ? (
                      <p className="text-center text-muted-foreground">No conversations found</p>
                    ) : (
                      <div className="space-y-2">
                        {conversations?.map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => setSelectedConversation(conv.id)}
                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                              selectedConversation === conv.id 
                                ? 'border-primary bg-primary/5' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                            data-testid={`conversation-item-${conv.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getChannelIcon(conv.channel)}
                                <span className="font-medium capitalize">{conv.channel.replace('_', ' ')}</span>
                              </div>
                              {getOutcomeBadge(conv.outcome)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Session: {conv.sessionId.slice(0, 8)}...</p>
                              <p>{conv.messages?.length || 0} messages, {conv.totalToolCalls || 0} tool calls</p>
                              <p>{formatDistanceToNow(new Date(conv.startedAt), { addSuffix: true })}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <ScrollArea className="h-[600px] rounded-md border p-4">
                    {selectedConversation && conversationDetails ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">Conversation Details</h3>
                          <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" data-testid="button-add-feedback">
                                <Star className="h-4 w-4 mr-2" />
                                Add Feedback
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Feedback</DialogTitle>
                                <DialogDescription>
                                  Rate this conversation or add corrections for training.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Feedback Type</Label>
                                  <Select 
                                    value={feedbackData.feedbackType} 
                                    onValueChange={(v) => setFeedbackData({...feedbackData, feedbackType: v})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="rating">Rating</SelectItem>
                                      <SelectItem value="correction">Correction</SelectItem>
                                      <SelectItem value="annotation">Annotation</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {feedbackData.feedbackType === 'rating' && (
                                  <div>
                                    <Label>Rating (1-5)</Label>
                                    <div className="flex gap-2 mt-2">
                                      {[1, 2, 3, 4, 5].map((r) => (
                                        <Button
                                          key={r}
                                          variant={feedbackData.rating === r ? 'default' : 'outline'}
                                          size="sm"
                                          onClick={() => setFeedbackData({...feedbackData, rating: r})}
                                        >
                                          {r}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {feedbackData.feedbackType === 'correction' && (
                                  <div>
                                    <Label>Corrected Response</Label>
                                    <Textarea 
                                      value={feedbackData.correctedResponse}
                                      onChange={(e) => setFeedbackData({...feedbackData, correctedResponse: e.target.value})}
                                      placeholder="Enter the corrected response..."
                                    />
                                  </div>
                                )}
                                <div>
                                  <Label>Notes</Label>
                                  <Textarea 
                                    value={feedbackData.annotation}
                                    onChange={(e) => setFeedbackData({...feedbackData, annotation: e.target.value})}
                                    placeholder="Add any notes about this feedback..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  onClick={() => addFeedbackMutation.mutate(feedbackData)}
                                  disabled={addFeedbackMutation.isPending}
                                  data-testid="button-submit-feedback"
                                >
                                  Save Feedback
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div className="space-y-3">
                          {conversationDetails.conversation.messages?.map((msg, idx) => (
                            <div 
                              key={idx}
                              className={`p-3 rounded-lg ${
                                msg.role === 'user' 
                                  ? 'bg-blue-100 dark:bg-blue-900 ml-8' 
                                  : msg.role === 'assistant' 
                                  ? 'bg-gray-100 dark:bg-gray-800 mr-8' 
                                  : 'bg-yellow-100 dark:bg-yellow-900 text-sm'
                              }`}
                              data-testid={`message-${idx}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {msg.role === 'user' ? (
                                  <User className="h-4 w-4" />
                                ) : msg.role === 'assistant' ? (
                                  <Bot className="h-4 w-4" />
                                ) : (
                                  <Wrench className="h-4 w-4" />
                                )}
                                <span className="text-xs font-medium capitalize">{msg.role}</span>
                                <span className="text-xs text-muted-foreground">{msg.timestamp && format(new Date(msg.timestamp), 'HH:mm:ss')}</span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              {msg.toolCalls && msg.toolCalls.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {msg.toolCalls.map((tc, tcIdx) => (
                                    <Badge key={tcIdx} variant="secondary" className="text-xs">
                                      <Wrench className="h-3 w-3 mr-1" />
                                      {tc.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {conversationDetails.toolCalls.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-semibold mb-3">Tool Calls</h4>
                            <div className="space-y-2">
                              {conversationDetails.toolCalls.map((tc) => (
                                <div 
                                  key={tc.id}
                                  className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800"
                                  data-testid={`tool-call-${tc.id}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Wrench className="h-4 w-4" />
                                      <span className="font-medium">{tc.toolName}</span>
                                      {tc.success ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                      )}
                                      <span className="text-xs text-muted-foreground">{tc.latencyMs}ms</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {tc.wasCorrectTool !== null && tc.wasCorrectTool !== undefined && (
                                        tc.wasCorrectTool ? (
                                          <Badge className="bg-green-100 text-green-800">Correct</Badge>
                                        ) : (
                                          <Badge className="bg-red-100 text-red-800">Wrong Tool</Badge>
                                        )
                                      )}
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedToolCall(tc);
                                          setReviewDialogOpen(true);
                                        }}
                                        data-testid={`button-review-tool-${tc.id}`}
                                      >
                                        <Flag className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    <p><strong>Arguments:</strong> {JSON.stringify(tc.arguments)}</p>
                                    {tc.userMessageTrigger && (
                                      <p><strong>Trigger:</strong> {tc.userMessageTrigger.slice(0, 100)}...</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {conversationDetails.feedback.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-semibold mb-3">Feedback</h4>
                            <div className="space-y-2">
                              {conversationDetails.feedback.map((fb) => (
                                <div key={fb.id} className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20">
                                  <div className="flex items-center gap-2">
                                    <Badge>{fb.feedbackType}</Badge>
                                    {fb.rating && <span>{fb.rating}/5 stars</span>}
                                    <span className="text-xs text-muted-foreground">by {fb.reviewedBy}</span>
                                  </div>
                                  {fb.annotation && <p className="text-sm mt-2">{fb.annotation}</p>}
                                  {fb.correctedResponse && (
                                    <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded">
                                      <p className="text-xs font-medium">Corrected Response:</p>
                                      <p className="text-sm">{fb.correctedResponse}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select a conversation to view details
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tool Usage Statistics</CardTitle>
                <CardDescription>Performance metrics for each tool</CardDescription>
              </CardHeader>
              <CardContent>
                {statsData?.toolCalls.byTool && Object.keys(statsData.toolCalls.byTool).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(statsData.toolCalls.byTool).map(([toolName, stats]) => (
                      <Card key={toolName} data-testid={`tool-stats-${toolName}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-4">
                            <Wrench className="h-5 w-5" />
                            <span className="font-medium">{toolName}</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Calls</span>
                              <span className="font-medium">{stats.count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Success Rate</span>
                              <span className={`font-medium ${stats.successRate > 90 ? 'text-green-600' : stats.successRate > 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {stats.successRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg Latency</span>
                              <span className="font-medium">{stats.avgLatency.toFixed(0)}ms</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No tool usage data available yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fine-tuning Export Preview</CardTitle>
                <CardDescription>
                  Preview of conversations that will be exported for OpenAI fine-tuning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {exportPreview?.totalExamples || 0} training examples ready
                  </Badge>
                </div>
                {exportPreview?.preview && exportPreview.preview.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {exportPreview.preview.slice(0, 5).map((example, idx) => (
                        <Card key={idx} className="p-4" data-testid={`export-example-${idx}`}>
                          <p className="text-sm font-medium mb-2">Example {idx + 1}</p>
                          <div className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-48">
                            <pre>{JSON.stringify(example, null, 2)}</pre>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No completed conversations with positive ratings available for export yet.
                  </p>
                )}
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleExport} disabled={!exportPreview?.totalExamples} data-testid="button-download-jsonl">
                    <Download className="h-4 w-4 mr-2" />
                    Download JSONL
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Tool Call</DialogTitle>
            <DialogDescription>
              Was this the correct tool to use for the customer's request?
            </DialogDescription>
          </DialogHeader>
          {selectedToolCall && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                <p className="text-sm"><strong>Tool:</strong> {selectedToolCall.toolName}</p>
                <p className="text-sm"><strong>Trigger:</strong> {selectedToolCall.userMessageTrigger}</p>
              </div>
              <div>
                <Label>Was this the correct tool?</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    variant={toolReviewData.wasCorrectTool ? 'default' : 'outline'}
                    onClick={() => setToolReviewData({...toolReviewData, wasCorrectTool: true})}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Correct
                  </Button>
                  <Button
                    variant={!toolReviewData.wasCorrectTool ? 'destructive' : 'outline'}
                    onClick={() => setToolReviewData({...toolReviewData, wasCorrectTool: false})}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Wrong Tool
                  </Button>
                </div>
              </div>
              {!toolReviewData.wasCorrectTool && (
                <>
                  <div>
                    <Label>Which tool should have been used?</Label>
                    <Select 
                      value={toolReviewData.correctToolSuggestion} 
                      onValueChange={(v) => setToolReviewData({...toolReviewData, correctToolSuggestion: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tool..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lookup_customer">lookup_customer</SelectItem>
                        <SelectItem value="get_services">get_services</SelectItem>
                        <SelectItem value="get_quote">get_quote</SelectItem>
                        <SelectItem value="search_availability">search_availability</SelectItem>
                        <SelectItem value="book_service_call">book_service_call</SelectItem>
                        <SelectItem value="emergency_help">emergency_help</SelectItem>
                        <SelectItem value="none">No tool needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Textarea 
                      value={toolReviewData.flagReason}
                      onChange={(e) => setToolReviewData({...toolReviewData, flagReason: e.target.value})}
                      placeholder="Why was this the wrong tool?"
                    />
                  </div>
                </>
              )}
              <div>
                <Label>Additional Notes</Label>
                <Textarea 
                  value={toolReviewData.annotation}
                  onChange={(e) => setToolReviewData({...toolReviewData, annotation: e.target.value})}
                  placeholder="Any other notes..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              onClick={() => reviewToolCallMutation.mutate(toolReviewData)}
              disabled={reviewToolCallMutation.isPending}
              data-testid="button-submit-review"
            >
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
