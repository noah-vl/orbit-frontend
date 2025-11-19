"use client";

import { useRef, useState } from "react";
import { KnowledgeGraph, KnowledgeGraphRef } from "@/components/features/graph/knowledge-graph";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const graphRef = useRef<KnowledgeGraphRef>(null);
  const [showMockData, setShowMockData] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <KnowledgeGraph ref={graphRef} showMockData={showMockData} />
      </div>
    </div>
  );
}
