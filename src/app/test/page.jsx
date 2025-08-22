"use client";

import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";

const DEV_UI_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TEST_UI === 'true' || process.env.NODE_ENV !== 'production';

export default function TestPage() {
  if (!DEV_UI_ENABLED) {
    // Hide the test route entirely in production unless explicitly enabled
    notFound();
  }

  // Use dynamic imports to avoid bundling debug components unless this page is used
  const CallTest = dynamic(() => import('@/components/call-test.jsx'), { ssr: false });
  const CallDebug = dynamic(() => import('@/components/call-debug.jsx'), { ssr: false });
  const CallStatusPanel = dynamic(() => import('@/components/call-status-panel.jsx'), { ssr: false });
  const CallStateMonitor = dynamic(() => import('@/components/call-state-monitor.jsx'), { ssr: false });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">WebRTC Call Testing & Debugging</h1>
        <p className="text-muted-foreground">
          Test and debug voice and video calls with comprehensive state monitoring
        </p>
      </div>
      
      <Tabs defaultValue="monitor" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="monitor">State Monitor</TabsTrigger>
          <TabsTrigger value="status">Call Status</TabsTrigger>
          <TabsTrigger value="test">Call Testing</TabsTrigger>
          <TabsTrigger value="debug">Debug & Diagnostics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monitor">
          <CallStateMonitor />
        </TabsContent>
        
        <TabsContent value="status">
          <CallStatusPanel />
        </TabsContent>
        
        <TabsContent value="test">
          <CallTest />
        </TabsContent>
        
        <TabsContent value="debug">
          <CallDebug />
        </TabsContent>
      </Tabs>
    </div>
  );
}
