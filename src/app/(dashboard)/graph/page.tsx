"use client";

import { useRef, useState } from "react";
import { KnowledgeGraph, KnowledgeGraphRef } from "@/components/features/graph/knowledge-graph";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

export default function GraphPage() {
  const graphRef = useRef<KnowledgeGraphRef>(null);
  const [showMockData, setShowMockData] = useState(true);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
          <h1 className="text-3xl font-bold tracking-tight">Graph View</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 mr-2">
              <Switch id="mock-data" checked={showMockData} onCheckedChange={setShowMockData} />
              <Label htmlFor="mock-data">Show Mock Data</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => graphRef.current?.zoomIn()}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => graphRef.current?.zoomOut()}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => graphRef.current?.reset()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <KnowledgeGraph ref={graphRef} showMockData={showMockData} />
      </div>
    </div>
  );
}

