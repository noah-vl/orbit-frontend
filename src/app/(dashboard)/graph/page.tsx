"use client";

import { useRef } from "react";
import { KnowledgeGraph, KnowledgeGraphRef } from "@/components/features/graph/knowledge-graph";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

export default function GraphPage() {
  const graphRef = useRef<KnowledgeGraphRef>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
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
      </div>
      <div className="flex-1 p-6 md:p-12 min-h-[600px]">
        <KnowledgeGraph ref={graphRef} />
      </div>
    </div>
  );
}

