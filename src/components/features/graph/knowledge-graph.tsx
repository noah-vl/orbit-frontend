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

// Fetch real data from Supabase
const fetchGraphData = async () => {
  try {
    const response = await fetch('https://xltqabrlmfalosewvjby.supabase.co/functions/v1/get_graph', {
      method: 'POST',
    });

    if (!response.ok) {
      console.error('Failed to fetch graph data');
      return { nodes: [], links: [] };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching graph data:', error);
    return { nodes: [], links: [] };
  }
};

export const KnowledgeGraph = forwardRef<KnowledgeGraphRef>((props, ref) => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

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

  const handleNodeClick = async (node: any) => {
    // Only handle clicks on articles (Group 2)
    if (node.group === 2) {
      // Fetch full article details
      try {
        const response = await fetch('https://xltqabrlmfalosewvjby.supabase.co/functions/v1/get_graph', {
          method: 'POST',
        });
        const graphData = await response.json();

        // Find the article in the data (we'll need to enhance the API to return full article data)
        // For now, just show the node data
        setSelectedArticle(node);
      } catch (error) {
        console.error('Error fetching article details:', error);
      }
    }
  };

  useEffect(() => {
    // Fetch real data instead of using mock data
    fetchGraphData().then(graphData => {
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;

      // Position Group 0 nodes (base categories) in a fixed circle
      const baseCategories = graphData.nodes.filter((n: any) => n.group === 0);
      const baseCategoryRadius = 150;

      baseCategories.forEach((node: any, i: number) => {
        const angle = (i / baseCategories.length) * 2 * Math.PI;
        node.fx = centerX + baseCategoryRadius * Math.cos(angle);
        node.fy = centerY + baseCategoryRadius * Math.sin(angle);
      });

      // Position Group 1 nodes (subcategories) in arcs around their parent categories
      const subcategories = graphData.nodes.filter((n: any) => n.group === 1);
      const subcategoryRadius = 280;

      // Group subcategories by their parent
      const subcatsByParent = new Map<string, any[]>();
      graphData.links.forEach((link: any) => {
        const source = typeof link.source === 'string' ? link.source : link.source.id;
        const target = typeof link.target === 'string' ? link.target : link.target.id;

        const sourceNode = graphData.nodes.find((n: any) => n.id === source);
        const targetNode = graphData.nodes.find((n: any) => n.id === target);

        if (sourceNode?.group === 0 && targetNode?.group === 1) {
          if (!subcatsByParent.has(source)) {
            subcatsByParent.set(source, []);
          }
          subcatsByParent.get(source)!.push(targetNode);
        }
      });

      // Position subcategories in arcs around their parent
      subcatsByParent.forEach((subs, parentId) => {
        const parent = baseCategories.find((n: any) => n.id === parentId);
        if (!parent) return;

        const parentAngle = Math.atan2(parent.fy! - centerY, parent.fx! - centerX);
        const arcSpan = Math.PI / 2; // 90 degree arc

        subs.forEach((sub, i) => {
          const offset = (i - (subs.length - 1) / 2) * (arcSpan / Math.max(subs.length, 1));
          const angle = parentAngle + offset;
          sub.fx = centerX + subcategoryRadius * Math.cos(angle);
          sub.fy = centerY + subcategoryRadius * Math.sin(angle);
        });
      });

      // Position Group 2 nodes (articles) around the outer ring
      const articles = graphData.nodes.filter((n: any) => n.group === 2);
      const articleRadius = 400;

      articles.forEach((article: any, i: number) => {
        const angle = (i / articles.length) * 2 * Math.PI;
        article.fx = centerX + articleRadius * Math.cos(angle);
        article.fy = centerY + articleRadius * Math.sin(angle);
      });

      setData(graphData);

      // Auto-zoom to fit after a short delay
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoomToFit(400);
        }
      }, 500);
    });

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
          const fontSize = 12 / globalScale;

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

        // Physics - adjusted for better spacing
        d3VelocityDecay={0.3}
        d3AlphaDecay={0.01}
        cooldownTicks={200}
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
      />

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="bg-background border rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedArticle.label}</h2>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                {selectedArticle.url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">URL</label>
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-500 hover:underline mt-1"
                    >
                      {selectedArticle.url}
                    </a>
                  </div>
                )}
                {selectedArticle.content && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Content Preview</label>
                    <div className="mt-2 text-sm prose prose-sm max-w-none">
                      {selectedArticle.content.substring(0, 500)}...
                    </div>
                  </div>
                )}
                {selectedArticle.created_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Added</label>
                    <p className="text-sm mt-1">
                      {new Date(selectedArticle.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

KnowledgeGraph.displayName = "KnowledgeGraph";
