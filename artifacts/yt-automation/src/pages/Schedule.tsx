import React from "react";
import { Layout } from "@/components/Layout";
import { Card, Badge, Button } from "@/components/ui-elements";
import { useGetSchedule } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Calendar, Clock, PlayCircle } from "lucide-react";

export default function Schedule() {
  const { data: schedule, isLoading } = useGetSchedule();

  return (
    <Layout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Upload Schedule</h1>
          <p className="text-muted-foreground mt-1">Calendar of automated video drops.</p>
        </div>
        <Button variant="outline"><Calendar className="w-4 h-4 mr-2" /> Sync Calendar</Button>
      </div>

      <Card className="p-0 overflow-hidden border-white/10">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : schedule && schedule.length > 0 ? (
          <div className="divide-y divide-white/5">
            {schedule.map((entry) => (
              <div key={entry.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">{entry.videoTitle}</h4>
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <span className="text-accent">{entry.channelName}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 
                        {format(new Date(entry.scheduledAt), 'MMM dd, yyyy • h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={entry.status === 'published' ? 'success' : 'warning'}>
                    {entry.status.toUpperCase()}
                  </Badge>
                  <Button variant="ghost" size="sm">Manage</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No videos scheduled</h3>
            <p className="text-muted-foreground mb-6">Push videos from your pipeline to scheduled to automate uploads.</p>
            <Button>Go to Pipeline</Button>
          </div>
        )}
      </Card>
    </Layout>
  );
}
