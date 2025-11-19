"use client";

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import { GraphChat } from "@/components/features/graph/graph-chat";
import { GraphFilter } from "@/components/features/graph/graph-filter";
import { generateData } from "@/components/features/graph/mock-data";
import { Eye, EyeOff, Tag, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Helper for deterministic random values based on string seed
const getStableRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) / 2147483647;
};

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

// Mock Data is now imported from mock-data.ts

// Fetch real data from Supabase
const fetchGraphData = async (teamId: string | null, accessToken: string | null) => {
  if (!teamId) {
    console.error('fetchGraphData: No team_id available');
    return { nodes: [], links: [] };
  }

  console.log('fetchGraphData: Requesting graph for team_id:', teamId);

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('fetchGraphData: Using access token');
    } else {
      console.warn('fetchGraphData: No access token provided');
    }

    const requestBody = { team_id: teamId };
    console.log('fetchGraphData: Request body:', requestBody);

    const response = await fetch('https://xltqabrlmfalosewvjby.supabase.co/functions/v1/get_graph', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log('fetchGraphData: Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('fetchGraphData: Failed to fetch graph data:', response.status, errorText);
      return { nodes: [], links: [] };
    }

    const data = await response.json();
    console.log('fetchGraphData: Success! Received', data.nodes?.length || 0, 'nodes and', data.links?.length || 0, 'links');
    return data;
  } catch (error) {
    console.error('fetchGraphData: Error fetching graph data:', error);
    return { nodes: [], links: [] };
  }
};

export const KnowledgeGraph = forwardRef<KnowledgeGraphRef, { showMockData?: boolean }>(({ showMockData = false }, ref) => {
  const { teamId, session } = useAuth();
  const [data, setData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [fetchedData, setFetchedData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [nodeRelevance, setNodeRelevance] = useState<Map<string, number>>(new Map());
  const [hoverNode, setHoverNode] = useState<any>(null);
  
  // Filter states
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(new Set());
  const [personalFitFilters, setPersonalFitFilters] = useState<Set<string>>(new Set());

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

  const handleNodeClick = (node: any) => {
    // Only handle clicks on articles (Group 2)
    if (node.group === 2) {
      // Navigate to article detail page if articleId is available
      if (node.articleId) {
        window.location.href = `/article/${node.articleId}`;
      } else if (node.id) {
        // Fallback: try using node.id as articleId
        window.location.href = `/article/${node.id}`;
      }
    }
  };

  useEffect(() => {
    // Fetch real data when teamId is available
    console.log('KnowledgeGraph: teamId =', teamId, 'session =', session);
    if (teamId && !showMockData) {
      const accessToken = session?.access_token || null;
      console.log('KnowledgeGraph: Fetching graph data for team:', teamId);
      fetchGraphData(teamId, accessToken).then(data => {
        console.log('KnowledgeGraph: Received data:', data);
        console.log('KnowledgeGraph: Number of nodes:', data.nodes?.length, 'Number of links:', data.links?.length);
        setFetchedData(data);
      }).catch(error => {
        console.error('KnowledgeGraph: Error fetching data:', error);
      });
    } else {
      console.warn('KnowledgeGraph: Not fetching - teamId:', teamId, 'showMockData:', showMockData);
    }
  }, [teamId, session, showMockData]);

  useEffect(() => {
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
    setTimeout(updateDimensions, 100);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    // Combine data and apply layout
    // We use (0,0) as the center of our world, as d3-force and react-force-graph generally prefer it.
    // The camera will zoom to fit this content.
    const centerX = 0;
    const centerY = 0;

    // Deep copy to avoid mutation issues
    const currentRealData = JSON.parse(JSON.stringify(fetchedData));
    let nodes = [...currentRealData.nodes];
    let links = [...currentRealData.links];

    if (showMockData) {
      const mockData = generateData();
      // Filter out mock nodes that might conflict with real nodes (by ID)
      const realIds = new Set(nodes.map(n => n.id));
      const newMockNodes = mockData.nodes.filter(n => !realIds.has(n.id));
      
      nodes = [...nodes, ...newMockNodes];
      links = [...links, ...mockData.links];
    }

    // Apply layout logic
    // Position Group 0 nodes (base categories) in a fixed circle
    const baseCategories = nodes.filter((n: any) => n.group === 0);
    const baseCategoryRadius = 150;

    baseCategories.forEach((node: any, i: number) => {
      const angle = (i / baseCategories.length) * 2 * Math.PI;
      node.fx = centerX + baseCategoryRadius * Math.cos(angle);
      node.fy = centerY + baseCategoryRadius * Math.sin(angle);
    });

    // Initialize other nodes near the center to prevent them from starting far away
    nodes.forEach((node: any) => {
      // Enrich with stable mock properties if missing (for filtering)
      if (node.group === 2) {
         if (node.read === undefined) {
             // Deterministic read status (approx 50% read)
             node.read = getStableRandom(node.id + "read") > 0.5;
         }
         if (!node.fit) {
             // Deterministic fit
             const r = getStableRandom(node.id + "fit");
             node.fit = r > 0.66 ? "high" : (r > 0.33 ? "medium" : "low");
         }
      }

      if (node.group !== 0) {
        node.fx = undefined;
        node.fy = undefined;
        // Start them near the center ring so they are picked up by the link force immediately
        if (!node.x) node.x = centerX + (Math.random() - 0.5) * 50;
        if (!node.y) node.y = centerY + (Math.random() - 0.5) * 50;
      }
    });

    setData({ nodes, links });

    // Auto-zoom to fit after a short delay
    setTimeout(() => {
      if (graphRef.current) {
        graphRef.current.zoomToFit(400);
      }
    }, 500);

  }, [fetchedData, showMockData, dimensions]);

  useEffect(() => {
    if (graphRef.current) {
      const fg = graphRef.current;
      
      // 1. Charge (Repulsion)
      // Increased strength for more "breathing room" between nodes
      fg.d3Force('charge').strength(-200).distanceMax(600);

      // 2. Link Force
      // Relaxed connections to allow more floating movement
      fg.d3Force('link').distance((link: any) => {
         const target = link.target;
         const group = target.group;
         
         if (group === 2) return 50;   // Articles: looser connection to subtopic
         if (group === 1) return 100;  // Subtopics: more space from main topic
         return 150; 
      });
      
      // 3. Custom Radial Force
      // Keeps Group 1 and Group 2 nodes in their respective concentric rings
      // Adjusted strength to be gentler (0.1) so they don't feel rigidly "dragged"
      const radialForce = (alpha: number) => {
        const cx = 0;
        const cy = 0;
        const strength = 0.1; // Very gentle pull to maintain ring structure loosely

        data.nodes.forEach((node: any) => {
          if (node.group === 0) return; // fixed nodes ignored

          const dx = node.x - cx || 1e-6;
          const dy = node.y - cy || 1e-6;
          const r = Math.sqrt(dx * dx + dy * dy);
          
          // Target radii - slightly larger for more space
          const targetRadius = node.group === 1 ? 320 : 480;
          
          // Force magnitude: pull towards radius
          // Apply alpha to decay force over time (stabilize)
          const k = (targetRadius - r) * alpha * strength;
          
          node.vx += (dx / r) * k;
          node.vy += (dy / r) * k;
        });
      };
      
      fg.d3Force('radial', radialForce);
      
      // Re-heat simulation
      fg.d3ReheatSimulation();
    }
  }, [data, dimensions]);

  useEffect(() => {
    const hasStatus = statusFilters.size > 0;
    const hasFit = personalFitFilters.size > 0;
    
    // If no filters active, clear relevance scores (return to default visualization)
    if (!hasStatus && !hasFit) {
      setNodeRelevance(new Map());
      return;
    }

    const newRelevance = new Map<string, number>();

    // Build Adjacency Map for propagation
    const adj = new Map<string, Set<string>>();
    data.links.forEach((link: any) => {
       const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
       const targetId = typeof link.target === 'object' ? link.target.id : link.target;
       
       if (!adj.has(sourceId)) adj.set(sourceId, new Set());
       if (!adj.has(targetId)) adj.set(targetId, new Set());
       
       adj.get(sourceId)!.add(targetId);
       adj.get(targetId)!.add(sourceId);
    });

    // Helper to find node by ID
    const nodeMap = new Map(data.nodes.map((n: any) => [n.id, n]));

    // 1. Score Group 2 (Articles) - The Leaves
    // Calculate match based on filters
    data.nodes.forEach((node: any) => {
      if (node.group !== 2) return;

      let matchesStatus = true;
      if (hasStatus) {
        const status = node.read ? "read" : "unread";
        matchesStatus = statusFilters.has(status);
      }

      let matchesFit = true;
      if (hasFit) {
        matchesFit = personalFitFilters.has(node.fit);
      }

      // Binary score for leaves: 1 if matches all active filters, 0 otherwise
      const score = (matchesStatus && matchesFit) ? 1 : 0;
      newRelevance.set(node.id, score);
    });

    // 2. Score Group 1 (Subtopics) - Aggregate of connected Articles
    data.nodes.forEach((node: any) => {
      if (node.group !== 1) return;
      
      const neighbors = Array.from(adj.get(node.id) || []);
      // Consider only connected Group 2 nodes (children)
      const children = neighbors.filter(nid => {
         const n = nodeMap.get(nid);
         return n && n.group === 2;
      });

      if (children.length > 0) {
        const sum = children.reduce((acc, nid) => acc + (newRelevance.get(nid) || 0), 0);
        newRelevance.set(node.id, sum / children.length);
      } else {
        newRelevance.set(node.id, 0);
      }
    });

    // 3. Score Group 0 (Departments) - Aggregate of connected Subtopics
    data.nodes.forEach((node: any) => {
      if (node.group !== 0) return;

      const neighbors = Array.from(adj.get(node.id) || []);
      // Consider only connected Group 1 nodes (children)
      const children = neighbors.filter(nid => {
         const n = nodeMap.get(nid);
         return n && n.group === 1;
      });

      if (children.length > 0) {
        const sum = children.reduce((acc, nid) => acc + (newRelevance.get(nid) || 0), 0);
        newRelevance.set(node.id, sum / children.length);
      } else {
        newRelevance.set(node.id, 0);
      }
    });

    setNodeRelevance(newRelevance);
    setHighlightNodes(new Set()); // Clear binary highlights if any
    
  }, [statusFilters, personalFitFilters, data]);

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

  const handleSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const matchedNodes = new Set();

    data.nodes.forEach((node: any) => {
      // Check id/label
      if (node.id && typeof node.id === 'string' && node.id.toLowerCase().includes(lowerQuery)) {
        matchedNodes.add(node.id);
      }
      // Check content if available
      if (node.content && typeof node.content === 'string' && node.content.toLowerCase().includes(lowerQuery)) {
        matchedNodes.add(node.id);
      }
    });

    if (matchedNodes.size > 0) {
      setHighlightNodes(matchedNodes);
      // Optionally clear highlight links or highlight links between matched nodes?
      setHighlightLinks(new Set());
      
      // If single match or small number, maybe zoom to them?
      if (graphRef.current && matchedNodes.size === 1) {
        const nodeId = Array.from(matchedNodes)[0];
        const node = data.nodes.find((n: any) => n.id === nodeId);
        if (node) {
            // graphRef.current.centerAt(node.x, node.y, 1000);
            // graphRef.current.zoom(2, 1000);
        }
      }
    }
  };

  const handleClearSearch = () => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    setHoverNode(null);
  };

  // Helper: Interpolate between two colors
  const interpolateColor = (score: number, start: number[], end: number[]) => {
    const r = Math.round(start[0] + (end[0] - start[0]) * score);
    const g = Math.round(start[1] + (end[1] - start[1]) * score);
    const b = Math.round(start[2] + (end[2] - start[2]) * score);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getNodeColor = (node: any) => {
    // Zinc-300 (light) to Zinc-900 (dark)
    const heatStart = [212, 212, 216]; 
    const heatEnd = [24, 24, 27];

    // 1. Hover Mode
    if (hoverNode) {
        if (highlightNodes.has(node.id)) {
             // If filtered, show heat color even on hover for context?
             if (nodeRelevance.size > 0) {
                 const score = nodeRelevance.get(node.id) || 0;
                 if (score > 0) {
                     return interpolateColor(score, heatStart, heatEnd);
                 }
             }
             if (node.group === 0) return "#52525b";
             if (node.group === 1) return "#a1a1aa";
             return "#d4d4d8";
        }
        return "#f4f4f5";
    }

    // 2. Filter Mode
    if (nodeRelevance.size > 0) {
         const score = nodeRelevance.get(node.id) || 0;
         if (score === 0) return "#f4f4f5";
         return interpolateColor(score, heatStart, heatEnd);
    }

    // 3. Search Mode
    if (highlightNodes.size > 0) {
        if (highlightNodes.has(node.id)) {
             if (node.group === 0) return "#52525b";
             if (node.group === 1) return "#a1a1aa";
             return "#d4d4d8";
        }
        return "#f4f4f5";
    }

    // 4. Default
    if (node.group === 0) return "#52525b";
    if (node.group === 1) return "#a1a1aa";
    return "#d4d4d8";
  };

  return (
    <div className="w-full h-full relative bg-white overflow-hidden" ref={containerRef}>
      <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
        <GraphFilter
          title="Status"
          options={[
            { label: "Read", value: "read", icon: Eye },
            { label: "Unread", value: "unread", icon: EyeOff },
          ]}
          selectedValues={statusFilters}
          onSelect={setStatusFilters}
        />
        <GraphFilter
          title="Personal Fit"
          options={[
            { label: "High Fit", value: "high" },
            { label: "Medium Fit", value: "medium" },
            { label: "Low Fit", value: "low" },
          ]}
          selectedValues={personalFitFilters}
          onSelect={setPersonalFitFilters}
        />
        {/* 
        <GraphFilter
          title="Category"
          options={[
            { label: "Marketing", value: "marketing" },
            { label: "Tech", value: "tech" },
            // ...
          ]}
          selectedValues={categoryFilters}
          onSelect={setCategoryFilters}
        /> 
        */}
      </div>
      
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
        nodeColor={getNodeColor}

        // Label/Text Styling
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.id;
          const fontSize = 12 / globalScale;

          // Calculate colors
          const color = getNodeColor(node);
          const isHighlighted = highlightNodes.has(node.id);
          const isHovered = hoverNode && (node.id === hoverNode.id || isHighlighted);
          const isDimmed = color === "#f4f4f5";
          
          // Draw Node Circle
          ctx.beginPath();
          const r = Math.sqrt(Math.max(0, node.val || 1)) * 4;
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

          // Fill
          ctx.fillStyle = color;
          ctx.fill();

          // Border/Stroke
          const score = nodeRelevance.get(node.id) || 0;
          const isRelevant = nodeRelevance.size > 0 && score > 0;

          if (node.group === 0 || isHovered || isHighlighted || isRelevant) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }

          // Text Label Visibility (Smooth Fade)
          let opacity = 0;
          
          if (isHovered || (isHighlighted && !isDimmed)) {
             opacity = 1;
          } else if (!isDimmed) {
             if (node.group === 0) {
                opacity = 1;
             } else if (node.group === 1) {
                // Fade in between scale 1.1 and 1.4
                opacity = (globalScale - 1.1) / (1.4 - 1.1);
             } else if (node.group === 2) {
                // Fade in between scale 2.2 and 2.6
                opacity = (globalScale - 2.2) / (2.6 - 2.2);
             }
             // Clamp
             opacity = Math.min(1, Math.max(0, opacity));
          }

          if (opacity > 0) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Color logic: Dark Zinc for normal, Light Zinc for dimmed (though dimmed usually hidden)
            // Normal: #18181b -> rgb(24, 24, 27)
            // Dimmed: #e4e4e7 -> rgb(228, 228, 231)
            const textR = isDimmed ? 228 : 24;
            const textG = isDimmed ? 228 : 24;
            const textB = isDimmed ? 231 : 27;

            ctx.fillStyle = `rgba(${textR}, ${textG}, ${textB}, ${opacity})`;
            ctx.font = `${isHovered || node.group === 0 ? '600' : '400'} ${fontSize}px Sans-Serif`;
            
            // Draw text below the node
            ctx.fillText(label, node.x, node.y + r + fontSize);
          }
        }}
        nodeCanvasObjectMode={() => 'replace'} // We draw everything

        // Link Styling
        linkColor={(link: any) => {
          if (highlightNodes.size > 0 || hoverNode) {
             // If both ends are highlighted, show link normally, else dim
             if (highlightNodes.has(link.source.id) && highlightNodes.has(link.target.id)) {
                 return "#e4e4e7";
             }
             return "#f4f4f5"; // very faint
          }
          return "#e4e4e7"; // default light gray
        }}
        linkWidth={(link: any) => highlightLinks.has(link) ? 2 : 1}
        linkDirectionalParticles={hoverNode ? 4 : 0}
        linkDirectionalParticleWidth={2}

        // Physics - adjusted for floating feel
        d3VelocityDecay={0.6} // High friction to reduce bouncing
        d3AlphaDecay={0.005} // Slow cooldown for gentle drift
        cooldownTicks={300}
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
      />

      <GraphChat onSearch={handleSearch} onClear={handleClearSearch} />
    </div>
  );
});

KnowledgeGraph.displayName = "KnowledgeGraph";
