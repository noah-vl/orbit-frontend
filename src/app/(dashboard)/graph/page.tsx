"use client";

import { useRef } from "react";
import { KnowledgeGraph, KnowledgeGraphRef } from "@/components/features/graph/knowledge-graph";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

export default function GraphPage() {
  const graphRef = useRef<KnowledgeGraphRef>(null);

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Graph View</h1>
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
      <div className="h-full min-h-[600px]">
        <KnowledgeGraph ref={graphRef} />
      </div>
    </div>
  );
}

