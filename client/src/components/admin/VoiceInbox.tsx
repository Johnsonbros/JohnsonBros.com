import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, CheckCircle, AlertTriangle, XCircle, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { type VoiceCallRecording } from "@shared/schema";

export function VoiceInbox() {
  const { data: recordings, isLoading } = useQuery<VoiceCallRecording[]>({
    queryKey: ["/api/v1/voice-training/recordings"],
  });

  if (isLoading) return <div>Loading recordings...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Voice Inbox</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recordings?.map((recording) => (
          <Card key={recording.id} className="relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              recording.grade === 'green' ? 'bg-green-500' :
              recording.grade === 'yellow' ? 'bg-yellow-500' :
              recording.grade === 'red' ? 'bg-red-500' : 'bg-gray-300'
            }`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {format(new Date(recording.createdAt), "MMM d, h:mm a")}
              </CardTitle>
              <Badge variant="outline">{recording.duration}s</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">
                SID: {recording.twilioCallSid.substring(0, 10)}...
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Button size="sm" variant="secondary" className="w-full">
                  <Play className="h-4 w-4 mr-2" /> Play
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" /> Review
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
