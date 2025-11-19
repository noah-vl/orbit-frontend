"use client";

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full flex items-center justify-center bg-muted/10">Loading Graph...</div>,
});

export interface KnowledgeGraphRef {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

// Mock Data
const generateData = () => {
  const nodes = [
    // Main Nodes (5)
    { id: "Marketing", group: 0, val: 25 },
    { id: "Sales", group: 0, val: 25 },
    { id: "Tech", group: 0, val: 25 },
    { id: "Product", group: 0, val: 25 },
    { id: "Finance", group: 0, val: 25 },

    // Marketing Subtopics & Articles
    { id: "SEO", group: 1, val: 10 },
    { id: "Social Media", group: 1, val: 10 },
    { id: "Content Strategy", group: 1, val: 10 },
    { id: "Ranking on Google", group: 2, val: 5 },
    { id: "Instagram Growth", group: 2, val: 5 },
    { id: "Viral Content", group: 2, val: 5 },

    // Sales Subtopics & Articles
    { id: "Outreach", group: 1, val: 10 },
    { id: "Closing", group: 1, val: 10 },
    { id: "CRM", group: 1, val: 10 },
    { id: "Cold Emailing 101", group: 2, val: 5 },
    { id: "Negotiation Tactics", group: 2, val: 5 },
    { id: "HubSpot vs Salesforce", group: 2, val: 5 },

    // Tech Subtopics & Articles
    { id: "Frontend", group: 1, val: 10 },
    { id: "Backend", group: 1, val: 10 },
    { id: "AI / ML", group: 1, val: 10 },
    { id: "React 19 Features", group: 2, val: 5 },
    { id: "Scalable APIs", group: 2, val: 5 },
    { id: "LLMs in Production", group: 2, val: 5 },

    // Product Subtopics & Articles
    { id: "Roadmap", group: 1, val: 10 },
    { id: "UX Design", group: 1, val: 10 },
    { id: "User Research", group: 1, val: 10 },
    { id: "Q4 Goals", group: 2, val: 5 },
    { id: "Accessibility Standards", group: 2, val: 5 },
    { id: "User Interviews", group: 2, val: 5 },

    // Finance Subtopics & Articles
    { id: "Budgeting", group: 1, val: 10 },
    { id: "Investments", group: 1, val: 10 },
    { id: "Payroll", group: 1, val: 10 },
    { id: "2025 Forecast", group: 2, val: 5 },
    { id: "Seed Funding", group: 2, val: 5 },
    { id: "Tax Compliance", group: 2, val: 5 },
  ];

  const links = [
    // Ring connection for main nodes
    { source: "Marketing", target: "Sales" },
    { source: "Sales", target: "Finance" },
    { source: "Finance", target: "Product" },
    { source: "Product", target: "Tech" },
    { source: "Tech", target: "Marketing" },

    // Marketing Links
    { source: "Marketing", target: "SEO" },
    { source: "Marketing", target: "Social Media" },
    { source: "Marketing", target: "Content Strategy" },
    { source: "SEO", target: "Ranking on Google" },
    { source: "Social Media", target: "Instagram Growth" },
    { source: "Content Strategy", target: "Viral Content" },

    // Sales Links
    { source: "Sales", target: "Outreach" },
    { source: "Sales", target: "Closing" },
    { source: "Sales", target: "CRM" },
    { source: "Outreach", target: "Cold Emailing 101" },
    { source: "Closing", target: "Negotiation Tactics" },
    { source: "CRM", target: "HubSpot vs Salesforce" },

    // Tech Links
    { source: "Tech", target: "Frontend" },
    { source: "Tech", target: "Backend" },
    { source: "Tech", target: "AI / ML" },
    { source: "Frontend", target: "React 19 Features" },
    { source: "Backend", target: "Scalable APIs" },
    { source: "AI / ML", target: "LLMs in Production" },

    // Product Links
    { source: "Product", target: "Roadmap" },
    { source: "Product", target: "UX Design" },
    { source: "Product", target: "User Research" },
    { source: "Roadmap", target: "Q4 Goals" },
    { source: "UX Design", target: "Accessibility Standards" },
    { source: "User Research", target: "User Interviews" },

    // Finance Links
    { source: "Finance", target: "Budgeting" },
    { source: "Finance", target: "Investments" },
    { source: "Finance", target: "Payroll" },
    { source: "Budgeting", target: "2025 Forecast" },
    { source: "Investments", target: "Seed Funding" },
    { source: "Payroll", target: "Tax Compliance" },
  ];

  return { nodes, links };
};

export const KnowledgeGraph = forwardRef<KnowledgeGraphRef>((props, ref) => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<any>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (graphRef.current) {
        graphRef.current.zoom(graphRef.current.zoom() * 1.2, 400);
      }
    },
    zoomOut: () => {
      if (graphRef.current) {
        graphRef.current.zoom(graphRef.current.zoom() / 1.2, 400);
      }
    },
    reset: () => {
      if (graphRef.current) {
        graphRef.current.zoomToFit(400);
      }
    }
  }));

  useEffect(() => {
    setData(generateData() as any);
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 600,
        });
      }
    };

    window.addEventListener("resize", updateDimensions);
    updateDimensions();
    
    // Small delay to ensure container is rendered
    setTimeout(updateDimensions, 100);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleNodeHover = (node: any) => {
    setHoverNode(node || null);
    
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();

    if (node) {
      newHighlightNodes.add(node.id);
      // Use the graph's internal data structure to find neighbors if possible, 
      // but since we have the raw data, we can filter links.
      // However, react-force-graph modifies the data objects to include neighbors.
      // Let's iterate links to find connected nodes.
      
      // Note: react-force-graph converts source/target to objects. 
      // We need to check if source/target matches our node.
      
      // We can access the graph data from state 'data', but the force graph library 
      // might have mutated it (processed it). 
      // Safe way: check the links in the passed 'data' or rely on visual properties.
      
      // Simplified approach using the processed links from the library if available,
      // or just iterating our local state links if they are properly updated.
      // Since 'data' is passed to the graph, the graph mutates it.
      
      (data.links as any[]).forEach(link => {
        if (link.source.id === node.id || link.target.id === node.id) {
          newHighlightLinks.add(link);
          newHighlightNodes.add(link.source.id);
          newHighlightNodes.add(link.target.id);
        }
      });
    }

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
    
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? "pointer" : "default";
    }
  };

  return (
    <div className="w-full h-full relative bg-white overflow-hidden rounded-lg border border-border" ref={containerRef} style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={data}
          
          // Colors & Style
          backgroundColor="#ffffff"
          
          // Node Styling
          nodeRelSize={6}
          nodeVal={(node: any) => node.val || 1}
          nodeColor={(node: any) => {
            // If we are hovering, dim non-neighbors
            if (hoverNode && !highlightNodes.has(node.id)) {
              return "#e4e4e7"; // zinc-200 (faded)
            }
            
            // Standard colors
            if (node.group === 0) return "#52525b"; // zinc-600
            if (node.group === 1) return "#a1a1aa"; // zinc-400
            return "#d4d4d8"; // zinc-300
          }}
          
          // Label/Text Styling
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.id;
            const fontSize = 12/globalScale;
            
            // Draw Node Circle
            const isHovered = hoverNode && highlightNodes.has(node.id);
            const isBackground = hoverNode && !highlightNodes.has(node.id);
            
            ctx.beginPath();
            const r = Math.sqrt(Math.max(0, node.val || 1)) * 4;
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            
            // Fill
            if (isBackground) {
               ctx.fillStyle = "#e4e4e7";
            } else {
               if (node.group === 0) ctx.fillStyle = "#52525b";
               else if (node.group === 1) ctx.fillStyle = "#a1a1aa";
               else ctx.fillStyle = "#d4d4d8";
            }
            ctx.fill();
            
            // Border/Stroke for main nodes or hovered
            if (node.group === 0 || isHovered) {
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }

            // Text Label
            // Show label if:
            // 1. It's a main node (group 0)
            // 2. It's hovered or a neighbor of hovered
            // 3. We are zoomed in enough (scale > 1.5)
            const showLabel = node.group === 0 || isHovered || globalScale > 1.5;

            if (showLabel) {
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = isBackground ? "#d4d4d8" : "#18181b";
              ctx.font = `${isHovered || node.group === 0 ? '600' : '400'} ${fontSize}px Sans-Serif`;
              // Draw text below the node
              ctx.fillText(label, node.x, node.y + r + fontSize);
            }
          }}
          nodeCanvasObjectMode={() => 'replace'} // We draw everything

          // Link Styling
          linkColor={(link: any) => {
            if (hoverNode) {
              return highlightLinks.has(link) ? "#52525b" : "#f4f4f5"; // dark or very faint
            }
            return "#e4e4e7"; // default light gray
          }}
          linkWidth={(link: any) => highlightLinks.has(link) ? 2 : 1}
          linkDirectionalParticles={hoverNode ? 4 : 0}
          linkDirectionalParticleWidth={2}
          
          // Physics
          d3VelocityDecay={0.1} // Low decay for more movement initially
          d3AlphaDecay={0.02}
          cooldownTicks={100}
          onNodeHover={handleNodeHover}
        />
    </div>
  );
});

KnowledgeGraph.displayName = "KnowledgeGraph";

