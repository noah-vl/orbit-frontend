"use client";

import { useRef } from "react";
import { KnowledgeGraph, KnowledgeGraphRef } from "@/components/features/graph/knowledge-graph";

export default function GraphPage() {
  const graphRef = useRef<KnowledgeGraphRef>(null);

  return (
    <div className="h-full overflow-hidden">
      <KnowledgeGraph ref={graphRef} showMockData={true} />
    </div>
  );
}

