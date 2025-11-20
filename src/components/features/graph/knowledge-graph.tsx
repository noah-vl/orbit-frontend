"use client";

import { useEffect, useState, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { GraphChat } from "@/components/features/graph/graph-chat";
import { generateData } from "@/components/features/graph/mock-data";
import { Tag, User, X, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full flex items-center justify-center bg-muted/10">Loading Graph...</div>,
});

const GRAPH_RING_RADII = {
  base: 150,
  subtopic: 350,
  article: 700,
} as const;

const GRAPH_RING_PADDING = 50;

const LINK_DISTANCES = {
  baseToSubtopic: GRAPH_RING_RADII.subtopic - GRAPH_RING_RADII.base + GRAPH_RING_PADDING, // keep subtopics comfortably outside base ring
  subtopicToArticle: GRAPH_RING_RADII.article - GRAPH_RING_RADII.subtopic, // span between subtopic and article rings
  fallback: 300,
} as const;

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

export const KnowledgeGraph = forwardRef<KnowledgeGraphRef, { showMockData?: boolean }>(({ showMockData: initialShowMockData = false }, ref) => {
  const { teamId, session } = useAuth();
  const [data, setData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [fetchedData, setFetchedData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [nodeRelevance, setNodeRelevance] = useState<Map<string, number>>(new Map());
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; title: string; similarity: number }>>([]);
  const [categoryResults, setCategoryResults] = useState<Array<{ category1: string; category2: string; sharedArticles: number; similarity: number }>>([]);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showMockData, setShowMockData] = useState(initialShowMockData);
  const [isQueryFocused, setIsQueryFocused] = useState(false);
  const [shouldPersistNotification, setShouldPersistNotification] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const zoomAdjustTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isZoomingRef = useRef(false);
  const latestQueryRef = useRef(""); // Track latest query to handle race conditions
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const [graphTransform, setGraphTransform] = useState({ zoom: 1, x: 0, y: 0 });
  const notificationDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationCleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function to cancel any pending zoom operations
  const cancelPendingZooms = useCallback(() => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = null;
    }
    if (zoomAdjustTimeoutRef.current) {
      clearTimeout(zoomAdjustTimeoutRef.current);
      zoomAdjustTimeoutRef.current = null;
    }
    isZoomingRef.current = false;
  }, []);

  const clearNotificationTimers = useCallback(() => {
    if (notificationDismissTimeoutRef.current) {
      clearTimeout(notificationDismissTimeoutRef.current);
      notificationDismissTimeoutRef.current = null;
    }
    if (notificationCleanupTimeoutRef.current) {
      clearTimeout(notificationCleanupTimeoutRef.current);
      notificationCleanupTimeoutRef.current = null;
    }
  }, []);

  const scheduleNotificationDismissal = useCallback(() => {
    clearNotificationTimers();
    notificationDismissTimeoutRef.current = setTimeout(() => {
      setIsFadingOut(true);
      notificationCleanupTimeoutRef.current = setTimeout(() => {
        setShowNotification(false);
        setNotificationMessage("");
        setIsFadingOut(false);
        setShouldPersistNotification(false);
      }, 500);
    }, 8000);
  }, [clearNotificationTimers]);

  useEffect(() => {
    return () => {
      clearNotificationTimers();
    };
  }, [clearNotificationTimers]);

  useEffect(() => {
    if (!notificationMessage || !showNotification) {
      clearNotificationTimers();
      return;
    }

    if (shouldPersistNotification) {
      if (isQueryFocused) {
        clearNotificationTimers();
        setIsFadingOut(false);
        return;
      }
      scheduleNotificationDismissal();
      return;
    }

    scheduleNotificationDismissal();
  }, [
    notificationMessage,
    showNotification,
    isQueryFocused,
    shouldPersistNotification,
    scheduleNotificationDismissal,
    clearNotificationTimers,
  ]);

  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.2, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() / 1.2, 400);
    }
  };

  const handleReset = useCallback(() => {
    // Cancel any pending zoom operations
    cancelPendingZooms();
    
    if (graphRef.current) {
      isZoomingRef.current = true;
      graphRef.current.zoomToFit(400);
      // Apply zoom-out multiplier after zoom animation completes
      zoomAdjustTimeoutRef.current = setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoom(graphRef.current.zoom() * 0.60, 400);
          // Mark zoom as complete after adjustment animation
          setTimeout(() => {
            isZoomingRef.current = false;
          }, 400);
        }
      }, 400);
    }
  }, [cancelPendingZooms]);

  useImperativeHandle(ref, () => ({
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    reset: handleReset
  }));

  const buildNodeNeighborhood = useCallback((node: any) => {
    const nodesSet = new Set<string>();
    const linksSet = new Set<any>();

    if (!node || !node.id) {
      return { nodesSet, linksSet };
    }

    nodesSet.add(node.id);

    (data.links as any[]).forEach(link => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source;
      const targetId = typeof link.target === "object" ? link.target.id : link.target;

      if (sourceId === node.id || targetId === node.id) {
        linksSet.add(link);
        if (sourceId) nodesSet.add(sourceId);
        if (targetId) nodesSet.add(targetId);
      }
    });

    return { nodesSet, linksSet };
  }, [data.links]);

  const clearLockedHighlight = useCallback(() => {
    if (!lockedNodeId) return;
    setLockedNodeId(null);
    if (nodeRelevance.size === 0) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
    handleReset();
  }, [handleReset, lockedNodeId, nodeRelevance.size]);

  const zoomToNodeCluster = useCallback((nodeSet: Set<string>) => {
    if (!graphRef.current || nodeSet.size === 0) return;

    cancelPendingZooms();

    const focusedNodes = (data.nodes as any[]).filter(
      (graphNode) => graphNode.id && nodeSet.has(graphNode.id) && typeof graphNode.x === "number" && typeof graphNode.y === "number"
    );

    if (focusedNodes.length === 0) return;

    const minX = Math.min(...focusedNodes.map((n) => n.x as number));
    const maxX = Math.max(...focusedNodes.map((n) => n.x as number));
    const minY = Math.min(...focusedNodes.map((n) => n.y as number));
    const maxY = Math.max(...focusedNodes.map((n) => n.y as number));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const boundsWidth = Math.max(maxX - minX, 1);
    const boundsHeight = Math.max(maxY - minY, 1);
    const padding = Math.max(200, GRAPH_RING_RADII.article * 0.15);

    const zoomX = dimensions.width / (boundsWidth + padding);
    const zoomY = dimensions.height / (boundsHeight + padding);
    const targetZoom = Math.min(6, Math.max(1.8, Math.min(zoomX, zoomY)));

    isZoomingRef.current = true;
    graphRef.current.centerAt(centerX, centerY, 600);
    graphRef.current.zoom(targetZoom, 600);
    setTimeout(() => {
      isZoomingRef.current = false;
    }, 650);
  }, [cancelPendingZooms, data.nodes, dimensions.height, dimensions.width]);

  const handleNodeClick = useCallback((node: any) => {
    if (!node) return;

    // Thematic nodes (Group 1) lock highlights & zoom
    if (node.group === 1 && nodeRelevance.size === 0) {
      const { nodesSet, linksSet } = buildNodeNeighborhood(node);
      setHighlightNodes(nodesSet);
      setHighlightLinks(linksSet);
      setLockedNodeId(node.id);
      zoomToNodeCluster(nodesSet);
      return;
    }

    // Any other click clears locked highlight
    if (lockedNodeId) {
      clearLockedHighlight();
    }

    // Article nodes (Group 2) navigate
    if (node.group === 2) {
      if (node.articleId) {
        window.location.href = `/article/${node.articleId}`;
      } else if (node.id) {
        window.location.href = `/article/${node.id}`;
      }
    }
  }, [buildNodeNeighborhood, clearLockedHighlight, lockedNodeId, nodeRelevance.size, zoomToNodeCluster]);

  useEffect(() => {
    // Fetch real data when teamId is available
    console.log('KnowledgeGraph: teamId =', teamId, 'session =', session);
    
    let isMounted = true;

    if (teamId && !showMockData) {
      const accessToken = session?.access_token || null;
      console.log('KnowledgeGraph: Fetching graph data for team:', teamId);
      fetchGraphData(teamId, accessToken).then(data => {
        if (!isMounted) return;
        console.log('KnowledgeGraph: Received data:', data);
        console.log('KnowledgeGraph: Number of nodes:', data.nodes?.length, 'Number of links:', data.links?.length);
        setFetchedData(data);
      }).catch(error => {
        if (!isMounted) return;
        console.error('KnowledgeGraph: Error fetching data:', error);
      });
    } else {
      console.warn('KnowledgeGraph: Not fetching - teamId:', teamId, 'showMockData:', showMockData);
    }

    return () => {
      isMounted = false;
    };
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingZooms();
    };
  }, [cancelPendingZooms]);

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
    
    // Only filter nodes if we have search results AND want to show only search results
    // But keep all nodes for highlighting to work correctly
    // We'll dim non-matching nodes instead of hiding them
    // This ensures highlightNodes and nodeRelevance work correctly

    // Ensure nodes have title property (use label or id as fallback)
    nodes.forEach((node: any) => {
      if (!node.title) {
        node.title = node.label || node.name || node.id;
      }
    });

    if (showMockData) {
      const mockData = generateData();
      // Filter out mock nodes that might conflict with real nodes (by ID)
      const realIds = new Set(nodes.map(n => n.id));
      const newMockNodes = mockData.nodes.filter(n => !realIds.has(n.id));
      
      nodes = [...nodes, ...newMockNodes];
      links = [...links, ...mockData.links];
    }

    // Filter out nodes that don't have any edges
    const nodesWithEdges = new Set<string>();
    links.forEach((link: any) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source;
      const targetId = typeof link.target === "object" ? link.target.id : link.target;
      if (sourceId) nodesWithEdges.add(sourceId);
      if (targetId) nodesWithEdges.add(targetId);
    });
    
    // Only keep nodes that have at least one edge
    nodes = nodes.filter((node: any) => nodesWithEdges.has(node.id));
    
    // Also filter links to only include edges between remaining nodes
    const remainingNodeIds = new Set(nodes.map((n: any) => n.id));
    links = links.filter((link: any) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source;
      const targetId = typeof link.target === "object" ? link.target.id : link.target;
      return remainingNodeIds.has(sourceId) && remainingNodeIds.has(targetId);
    });

    // Apply layout logic
    // Position Group 0 nodes (base categories) in a fixed circle
    const baseCategories = nodes.filter((n: any) => n.group === 0);
    const baseCategoryRadius = GRAPH_RING_RADII.base;

    baseCategories.forEach((node: any, i: number) => {
      const angle = (i / baseCategories.length) * 2 * Math.PI;
      node.fx = centerX + baseCategoryRadius * Math.cos(angle);
      node.fy = centerY + baseCategoryRadius * Math.sin(angle);
    });

    // Initialize other nodes near the center to prevent them from starting far away
    nodes.forEach((node: any) => {
      if (node.group !== 0) {
        node.fx = undefined;
        node.fy = undefined;
        // Initialize nodes at their target radius to help with grouping
        // This gives the radial force a better starting point
        // Ensure they start outside the base category ring
        const targetRadius = node.group === 1 ? GRAPH_RING_RADII.subtopic : GRAPH_RING_RADII.article;
        const angle = Math.random() * 2 * Math.PI; // Random angle around circle
        if (!node.x) node.x = centerX + targetRadius * Math.cos(angle);
        if (!node.y) node.y = centerY + targetRadius * Math.sin(angle);
      }
    });

    setData({ nodes, links });

    // Auto-zoom to fit after a short delay (only if not in search mode and not already zooming)
    if (highlightNodes.size === 0 && !isZoomingRef.current) {
      // Cancel any pending zoom operations
      cancelPendingZooms();
      
      zoomTimeoutRef.current = setTimeout(() => {
        if (graphRef.current && !isZoomingRef.current) {
          isZoomingRef.current = true;
          graphRef.current.zoomToFit(400);
          // Apply zoom-out multiplier after zoom animation completes
          zoomAdjustTimeoutRef.current = setTimeout(() => {
            if (graphRef.current) {
              graphRef.current.zoom(graphRef.current.zoom() * 0.60, 400);
              // Mark zoom as complete after adjustment animation
              setTimeout(() => {
                isZoomingRef.current = false;
              }, 400);
            }
          }, 400);
        }
      }, 500);
    }

    // Cleanup function to cancel pending zooms when dependencies change
    return () => {
      cancelPendingZooms();
    };
  }, [fetchedData, showMockData]);

  useEffect(() => {
    if (!lockedNodeId || nodeRelevance.size > 0) return;

    const lockedNode = (data.nodes as any[]).find((node) => node.id === lockedNodeId);

    if (!lockedNode) {
      setLockedNodeId(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }

    const { nodesSet, linksSet } = buildNodeNeighborhood(lockedNode);
    setHighlightNodes(nodesSet);
    setHighlightLinks(linksSet);
  }, [buildNodeNeighborhood, data.nodes, lockedNodeId, nodeRelevance.size]);

  const targetAngles = useMemo(() => {
    if (!data.nodes.length) return new Map<string, number>();

    const angleMap = new Map<string, number>();
    data.nodes.forEach((node: any) => {
      if (node.group === 0 && typeof node.fx === "number" && typeof node.fy === "number") {
        angleMap.set(node.id, Math.atan2(node.fy, node.fx));
      }
    });

    if (!angleMap.size) return angleMap;

    const getNodeId = (nodeRef: any) =>
      typeof nodeRef === "object" && nodeRef !== null ? nodeRef.id : nodeRef;

    let changed = true;
    let iterations = 0;
    while (changed && iterations < 5) {
      changed = false;
      iterations += 1;

      data.links.forEach((link: any) => {
        const sourceId = getNodeId(link.source);
        const targetId = getNodeId(link.target);
        const sourceAngle = sourceId ? angleMap.get(sourceId) : undefined;
        const targetAngle = targetId ? angleMap.get(targetId) : undefined;

        if (sourceAngle !== undefined && targetId && targetAngle === undefined) {
          angleMap.set(targetId, sourceAngle);
          changed = true;
        } else if (targetAngle !== undefined && sourceId && sourceAngle === undefined) {
          angleMap.set(sourceId, targetAngle);
          changed = true;
        }
      });
    }

    return angleMap;
  }, [data.links, data.nodes]);

  useEffect(() => {
    if (graphRef.current && data.nodes.length > 0) {
      const fg = graphRef.current;
      
      // 1. Charge (Repulsion) - stronger to push nodes apart
      // Use distance-based charge to prevent nodes from clustering in center
      fg.d3Force('charge')?.strength((node: any) => {
        // Stronger repulsion for nodes closer to center to push them outward
        const r = Math.sqrt((node.x || 0) ** 2 + (node.y || 0) ** 2);
        if (r < 200) {
          return -500; // Very strong repulsion near center
        }
        return -300; // Normal repulsion further out
      }).distanceMax(GRAPH_RING_RADII.article + 300);

      // 2. Link Force - keeps connected nodes at appropriate distances
      fg.d3Force('link')?.distance((link: any) => {
         const resolveGroup = (nodeRef: any) => {
           if (typeof nodeRef === 'object' && nodeRef !== null && typeof nodeRef.group === 'number') {
             return nodeRef.group;
           }
           const nodeId = typeof nodeRef === 'object' && nodeRef !== null ? nodeRef.id : nodeRef;
           return data.nodes.find((n: any) => n.id === nodeId)?.group;
         };

         const sourceGroup = resolveGroup(link.source);
         const targetGroup = resolveGroup(link.target);
         const groups = [sourceGroup, targetGroup];

         if (groups.includes(2)) {
           return LINK_DISTANCES.subtopicToArticle;
         }
         if (groups.includes(1) && groups.includes(0)) {
           return LINK_DISTANCES.baseToSubtopic;
         }
         return LINK_DISTANCES.fallback;
      });
      
      // 3. Custom Radial Force - strong to maintain ring structure and prevent inward collapse
      // This keeps Group 1 and Group 2 nodes in their respective concentric rings
      const radialForce = (alpha: number) => {
        const cx = 0;
        const cy = 0;
        const strength = 0.8; // Much stronger to maintain ring structure and push outward

        data.nodes.forEach((node: any) => {
          if (node.group === 0) return; // fixed nodes ignored (base categories)

          const dx = node.x - cx || 1e-6;
          const dy = node.y - cy || 1e-6;
          const r = Math.sqrt(dx * dx + dy * dy);
          
          // Target radii for each group - ensure they're outside the base category ring (150px)
          const minRadius = GRAPH_RING_RADII.base + GRAPH_RING_PADDING; // Minimum radius to stay outside base categories
          const targetRadius = node.group === 1 ? GRAPH_RING_RADII.subtopic : GRAPH_RING_RADII.article; // Subcategories at 350, Articles at 900
          
          // If node is too close to center, push it outward strongly
          if (r < minRadius) {
            const pushStrength = (minRadius - r) * alpha * 2.0; // Very strong push outward
            node.vx = (node.vx || 0) + (dx / r) * pushStrength;
            node.vy = (node.vy || 0) + (dy / r) * pushStrength;
          }
          
          // Force magnitude: pull towards target radius
          // Stronger force when further from target
          const k = (targetRadius - r) * alpha * strength;
          
          node.vx = (node.vx || 0) + (dx / r) * k;
          node.vy = (node.vy || 0) + (dy / r) * k;

          const targetAngle = targetAngles.get(node.id);
          if (targetAngle !== undefined && r > 0) {
            const angle = Math.atan2(dy, dx);
            let angleDelta = targetAngle - angle;
            angleDelta = Math.atan2(Math.sin(angleDelta), Math.cos(angleDelta));
            const angularStrength = 0.05;
            const tangentialX = (-dy / r) * angleDelta * angularStrength;
            const tangentialY = (dx / r) * angleDelta * angularStrength;
            node.vx = (node.vx || 0) + tangentialX;
            node.vy = (node.vy || 0) + tangentialY;
          }
        });
      };
      
      fg.d3Force('radial', radialForce);
      
      // Re-heat simulation to apply forces (only when data changes, not on hover)
      fg.d3ReheatSimulation();
    }
  }, [data, dimensions, targetAngles]); // Re-run when data changes to update closures

  // Use useCallback to prevent excessive re-renders and memoize the handler
  const handleNodeHover = useCallback((node: any) => {
    setHoverNode(node || null);

    if (containerRef.current) {
      containerRef.current.style.cursor = node ? "pointer" : "default";
    }

    // Don't override search or locked highlights
    if (nodeRelevance.size > 0 || lockedNodeId) {
      return;
    }

    if (node) {
      const { nodesSet, linksSet } = buildNodeNeighborhood(node);
      setHighlightNodes(nodesSet);
      setHighlightLinks(linksSet);
    } else if (highlightNodes.size > 0) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, [buildNodeNeighborhood, highlightNodes.size, lockedNodeId, nodeRelevance.size]);

  const handleSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    
    if (!teamId || !trimmedQuery) {
      console.log('Search skipped: missing teamId or empty query', { teamId, query: trimmedQuery });
      setSearchError('Missing team ID or empty query');
      return;
    }

    // If it's the same query, don't search again (prevent duplicate searches)
    if (currentQuery === trimmedQuery && searchLoading) {
      console.log('Same query already in progress, skipping');
      return;
    }

    console.log('Starting NEW search:', { query: trimmedQuery, teamId, previousQuery: currentQuery });
    
    // Update current query immediately
    setCurrentQuery(trimmedQuery);
    latestQueryRef.current = trimmedQuery;
    
    // Clear ALL previous search state immediately (use functional updates to ensure they happen)
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);
    setActiveResultIndex(null);
    setCategoryResults([]);
    clearNotificationTimers();
    setShowNotification(false);
    setNotificationMessage("");
    setIsFadingOut(false);
    setShouldPersistNotification(false);
    setLockedNodeId(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    setNodeRelevance(new Map());

    try {
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHFhYnJsbWZhbG9zZXd2amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDYwNDcsImV4cCI6MjA3OTEyMjA0N30.RHHhm4Whc8uJ1lwPwYqC1KU8B_m6hBm_XC0MCPbNiWg';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Use semantic search endpoint (vector embeddings)
      console.log('Using semantic search with vector embeddings');
      const response = await fetch('https://xltqabrlmfalosewvjby.supabase.co/functions/v1/search_natural', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: trimmedQuery,
          team_id: teamId,
          limit: 5,
        }),
        cache: 'no-store', // Ensure fresh request (no Cache-Control header needed)
      });

      console.log('Search response status:', response.status);

      // If 401, retry without Authorization header (team_id is in body, so it should work)
      let responseData: any;
      if (response.status === 401 && session?.access_token) {
        console.warn('401 error, retrying without Authorization header');
        const retryHeaders: HeadersInit = {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        };
        
        const retryResponse = await fetch('https://xltqabrlmfalosewvjby.supabase.co/functions/v1/search_natural', {
          method: 'POST',
          headers: retryHeaders,
          body: JSON.stringify({
            query: trimmedQuery,
            team_id: teamId,
            limit: 5,
          }),
          cache: 'no-store',
        });

        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          console.error('Search failed on retry:', retryResponse.status, errorText);
          setSearchError(`Search failed: ${retryResponse.status}`);
          setSearchLoading(false);
          return;
        }

        responseData = await retryResponse.json();
        console.log('Search response data (retry):', responseData);
      } else if (!response.ok) {
        const errorText = await response.text();
        console.error('Search failed:', response.status, errorText);
        setSearchError(`Search failed: ${response.status}`);
        setSearchLoading(false);
        return;
      } else {
        responseData = await response.json();
      }

      if (latestQueryRef.current !== trimmedQuery) {
        console.log('Search result ignored: query changed or cleared');
        setSearchLoading(false);
        return;
      }

      console.log('Search response data:', responseData);
      
      // Handle both articles and categories
      const articles = responseData.articles || [];
      const categories = responseData.categories || [];
      const overlaps = responseData.overlaps || [];
      const summary = responseData.summary || "";
      
      console.log('Search summary received:', summary);
      
      // Set the AI-generated summary (only if LLM generated one)
      if (summary) {
        setNotificationMessage(summary);
        setIsFadingOut(false);
        setShouldPersistNotification(true);
        setShowNotification(true);
      }
      
      // Use original fetched data for searching, not filtered data
      const originalNodes = JSON.parse(JSON.stringify(fetchedData.nodes));
      const originalLinks = JSON.parse(JSON.stringify(fetchedData.links));
      
      // Find category nodes in the graph and highlight them
      const matchedCategoryNodes = new Set<string>();
      const categoryRelevanceMap = new Map<string, number>();
      const allMatchedNodes = new Set<string>();
      const combinedRelevanceMap = new Map<string, number>();
      
      if (categories && categories.length > 0) {
        console.log('Found categories:', categories.length, 'for query:', trimmedQuery);
        
        categories.forEach((category: any) => {
          // Find nodes that match this category
          // Category nodes use tag name as their id and label (from get_graph)
          originalNodes.forEach((node: any) => {
            // Match by name (category nodes use tag name as id/label)
            if (node.id === category.name || 
                node.label === category.name ||
                node.id === category.id) {
              matchedCategoryNodes.add(node.id);
              allMatchedNodes.add(node.id);
              const similarity = category.similarity || 0.8;
              categoryRelevanceMap.set(node.id, similarity);
              combinedRelevanceMap.set(node.id, similarity);
              // Don't add connected nodes - only highlight exact matches
            }
          });
        });
        
        // Set category overlaps for display (use actual overlaps from API)
        if (overlaps.length > 0) {
          setCategoryResults(overlaps);
        } else {
          // Fallback: show individual categories if no overlaps
          setCategoryResults(categories.map((cat: any) => ({
            category1: cat.name,
            category2: '',
            sharedArticles: 0,
            similarity: cat.similarity,
          })));
        }
      }
      
      // Handle article search results
      if (!articles || articles.length === 0) {
        console.log('No articles or categories found for query:', trimmedQuery);
        
        const noResultsMessage = `No matching articles were found for "${trimmedQuery}". Try another query.`;
        setNotificationMessage(noResultsMessage);
        setIsFadingOut(false);
        setShouldPersistNotification(false);
        setShowNotification(true);

        // Clear all state when no results
        setSearchResults([]);
        setActiveResultIndex(null);
        setCategoryResults([]);
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
        setNodeRelevance(new Map());
        setLockedNodeId(null);
        setSearchError(null);
        setSearchLoading(false);
        return;
      }

      console.log('Found articles:', articles.length, 'for query:', trimmedQuery);

      // Create a map of article IDs to similarity scores and store results
      const relevanceMap = new Map<string, number>();
      const matchedArticleIds = new Set<string>();
      const results: Array<{ id: string; title: string; similarity: number }> = [];
      
      articles.forEach((article: any) => {
        matchedArticleIds.add(article.id);
        const similarity = article.similarity || 0;
        relevanceMap.set(article.id, similarity);
        results.push({
          id: article.id,
          title: article.title || 'Untitled',
          similarity: similarity,
        });
      });

      // Also map similarity scores to node IDs (for nodes that use articleId)
      originalNodes.forEach((node: any) => {
        if (node.articleId && matchedArticleIds.has(node.articleId)) {
          const similarity = relevanceMap.get(node.articleId) || 0;
          relevanceMap.set(node.id, similarity); // Also map by node.id for highlighting
        }
      });

      // Sort by similarity (highest first)
      results.sort((a, b) => b.similarity - a.similarity);
      setSearchResults(results);
      setActiveResultIndex(results.length > 0 ? 0 : null);

      // Find matching article nodes in the graph
      originalNodes.forEach((node: any) => {
        // Check if node represents an article by articleId (UUID) or by URL
        if (node.articleId && matchedArticleIds.has(node.articleId)) {
          allMatchedNodes.add(node.id);
          const similarity = relevanceMap.get(node.articleId) || 0;
          combinedRelevanceMap.set(node.id, similarity);
        } else if (node.id && matchedArticleIds.has(node.id)) {
          allMatchedNodes.add(node.id);
          const similarity = relevanceMap.get(node.id) || 0;
          combinedRelevanceMap.set(node.id, similarity);
        } else if (node.url && articles.some((a: any) => a.url === node.url)) {
          allMatchedNodes.add(node.id);
          const article = articles.find((a: any) => a.url === node.url);
          combinedRelevanceMap.set(node.id, article?.similarity || 0);
        }
      });

      console.log('Matched nodes (articles + categories):', allMatchedNodes.size);

      // Combine article and category relevance maps
      // Category nodes get priority if both exist
      matchedCategoryNodes.forEach((nodeId) => {
        const catSim = categoryRelevanceMap.get(nodeId) || 0;
        const articleSim = combinedRelevanceMap.get(nodeId) || 0;
        // Use the higher similarity score
        combinedRelevanceMap.set(nodeId, Math.max(catSim, articleSim));
      });

      // Only highlight exact search results - categories and articles
      // Don't add connected nodes, just the direct matches
      const visibleNodeIds = new Set<string>(allMatchedNodes);
      
      // Make sure category nodes from overlaps are included
      if (overlaps.length > 0) {
        overlaps.forEach((overlap: any) => {
          // Find nodes for both categories in the overlap
          const cat1Node = originalNodes.find((n: any) => 
            n.id === overlap.category1 || n.label === overlap.category1
          );
          const cat2Node = originalNodes.find((n: any) => 
            n.id === overlap.category2 || n.label === overlap.category2
          );
          
          if (cat1Node) visibleNodeIds.add(cat1Node.id);
          if (cat2Node) visibleNodeIds.add(cat2Node.id);
        });
      }
      
      setHighlightNodes(visibleNodeIds);
      setHighlightLinks(new Set());
      setNodeRelevance(combinedRelevanceMap);

      // Zoom to first match if available (prioritize categories)
      if (graphRef.current && allMatchedNodes.size > 0) {
        // Prefer category nodes if available, otherwise use first article node
        const nodeIdToZoom = matchedCategoryNodes.size > 0 
          ? Array.from(matchedCategoryNodes)[0]
          : Array.from(allMatchedNodes)[0];
        
        const node = originalNodes.find((n: any) => n.id === nodeIdToZoom);
        if (node && node.x !== undefined && node.y !== undefined) {
          graphRef.current.centerAt(node.x, node.y, 1000);
          graphRef.current.zoom(2, 1000);
        }
      } else {
        console.warn('No matching nodes found in graph for search results');
        setSearchError('No matching articles or categories found in the graph');
      }
    } catch (error) {
      console.error('Error performing vector search:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      // Clear all results on error
      setSearchResults([]);
      setActiveResultIndex(null);
      setCategoryResults([]);
      clearNotificationTimers();
      setNotificationMessage("");
      setShowNotification(false);
      setIsFadingOut(false);
      setShouldPersistNotification(false);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      setNodeRelevance(new Map());
      setLockedNodeId(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    latestQueryRef.current = "";
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    setHoverNode(null);
    setLockedNodeId(null);
    setNodeRelevance(new Map());
    setSearchError(null);
    setSearchLoading(false);
    setSearchResults([]);
    setActiveResultIndex(null);
    setCategoryResults([]);
    clearNotificationTimers();
    setShowNotification(false);
    setNotificationMessage("");
    setIsFadingOut(false);
    setShouldPersistNotification(false);
    setCurrentQuery(""); // Clear current query tracking
    handleReset();
  };

  const findNodeForResult = useCallback((resultId: string) => {
    if (!resultId) return null;
    return (data.nodes as any[]).find(
      (node) =>
        node.id === resultId ||
        node.articleId === resultId
    ) || null;
  }, [data.nodes]);

  useEffect(() => {
    if (activeResultIndex === null || searchResults.length === 0) return;
    const targetResult = searchResults[activeResultIndex];
    if (!targetResult) return;

    const targetNode = findNodeForResult(targetResult.id);
    if (!targetNode || typeof targetNode.x !== "number" || typeof targetNode.y !== "number") {
      console.warn('Step navigation: no node found for result', targetResult.id);
      return;
    }

    cancelPendingZooms();
    if (graphRef.current) {
      isZoomingRef.current = true;
      const duration = 600;
      graphRef.current.centerAt(targetNode.x, targetNode.y, duration);
      const currentZoom = typeof graphRef.current.zoom === "function" ? graphRef.current.zoom() : 1;
      const targetZoom = Math.max(2.2, Math.min(4, currentZoom < 2 ? 2.4 : currentZoom));
      graphRef.current.zoom(targetZoom, duration);
      setTimeout(() => {
        isZoomingRef.current = false;
      }, duration + 50);
    }
  }, [activeResultIndex, searchResults, findNodeForResult, cancelPendingZooms]);

  const handleResultStepper = useCallback((direction: "prev" | "next") => {
    if (searchResults.length === 0) return;
    setActiveResultIndex((prev) => {
      const total = searchResults.length;
      if (total === 0) return null;
      const delta = direction === "next" ? 1 : -1;
      const baseIndex = typeof prev === "number" ? prev : direction === "next" ? -1 : 0;
      return (baseIndex + delta + total) % total;
    });
  }, [searchResults.length]);

  // Helper: Interpolate between two colors
  const interpolateColor = (score: number, start: number[], end: number[]) => {
    const r = Math.round(start[0] + (end[0] - start[0]) * score);
    const g = Math.round(start[1] + (end[1] - start[1]) * score);
    const b = Math.round(start[2] + (end[2] - start[2]) * score);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Helper: Get similarity-based color (green to yellow)
  const getSimilarityColor = (similarity: number) => {
    // Normalize similarity to 0-1 range (assuming similarity is already 0-1)
    const normalized = Math.max(0, Math.min(1, similarity));
    
    // Vibrant green (high similarity): rgb(52, 211, 153) = #34d399
    // Vibrant yellow (low similarity): rgb(252, 211, 77) = #fcd34d
    const green = [52, 211, 153];
    const yellow = [252, 211, 77];
    
    // Invert so higher similarity = more green
    // Lower similarity = more yellow
    return interpolateColor(normalized, yellow, green);
  };

  const getNodeColor = (node: any) => {
    // 1. Search Mode with similarity scores - use green-to-yellow gradient
    if (highlightNodes.size > 0 && nodeRelevance.size > 0) {
      if (highlightNodes.has(node.id)) {
        const similarity = nodeRelevance.get(node.id) || 0;
        if (similarity > 0) {
          return getSimilarityColor(similarity);
        }
        // If node is highlighted but no similarity score (shouldn't happen, but fallback)
        if (node.group === 0) return "#52525b";
        if (node.group === 1) return "#a1a1aa";
        return "#d4d4d8";
      }
      // Dim non-matching nodes
      return "#f4f4f5";
    }

    // 2. Hover Mode
    if (hoverNode) {
        if (highlightNodes.has(node.id)) {
             // If filtered, show similarity color even on hover for context
             if (nodeRelevance.size > 0) {
                 const score = nodeRelevance.get(node.id) || 0;
                 if (score > 0) {
                     return getSimilarityColor(score);
                 }
             }
             if (node.group === 0) return "#52525b";
             if (node.group === 1) return "#a1a1aa";
             return "#d4d4d8";
        }
        return "#f4f4f5";
    }

    // 3. Search Mode (without similarity scores - fallback)
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

  // Helper to update background transform (kept for onZoom callback)
  // Note: We use requestAnimationFrame to defer state updates and avoid render warnings
  const updateBackgroundTransform = useCallback((zoom: number | { k: number; x: number; y: number }) => {
    // Defer state update to avoid updating during render
    requestAnimationFrame(() => {
      if (!graphRef.current) return;
      const zoomValue = typeof zoom === 'number' ? zoom : zoom.k;
      setGraphTransform(prev => ({ ...prev, zoom: zoomValue }));
    });
  }, []);

  // Continuously update background to track pan/zoom
  useEffect(() => {
    let animationFrameId: number;
    
    const updateBackground = () => {
      const canvas = backgroundCanvasRef.current;
      if (!canvas || !graphRef.current) {
        animationFrameId = requestAnimationFrame(updateBackground);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameId = requestAnimationFrame(updateBackground);
        return;
      }
      
      // Get current transform from graph
      try {
        const currentZoom = graphRef.current.zoom();
        const centerScreenX = dimensions.width / 2;
        const centerScreenY = dimensions.height / 2;
        const centerGraph = graphRef.current.screen2GraphCoords(centerScreenX, centerScreenY);
        
        const zoom = currentZoom || 1;
        const centerX = centerGraph.x || 0;
        const centerY = centerGraph.y || 0;
        
        // Set canvas size
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw dots
        const dotSpacing = 20; // Base spacing in graph coordinates
        const dotSize = 1;
        const dotColor = 'rgba(0, 0, 0, 0.05)';
        
        ctx.fillStyle = dotColor;
        
        // Calculate visible area in graph coordinates
        const visibleWidth = dimensions.width / zoom;
        const visibleHeight = dimensions.height / zoom;
        
        // Calculate bounds
        const startX = Math.floor((centerX - visibleWidth / 2) / dotSpacing) * dotSpacing;
        const startY = Math.floor((centerY - visibleHeight / 2) / dotSpacing) * dotSpacing;
        const endX = centerX + visibleWidth / 2 + dotSpacing;
        const endY = centerY + visibleHeight / 2 + dotSpacing;
        
        // Draw dots
        for (let x = startX; x < endX; x += dotSpacing) {
          for (let y = startY; y < endY; y += dotSpacing) {
            // Convert graph coordinates to screen coordinates
            const screenX = (x - centerX) * zoom + dimensions.width / 2;
            const screenY = (y - centerY) * zoom + dimensions.height / 2;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, dotSize, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      } catch (e) {
        // Fallback if methods not available
      }
      
      animationFrameId = requestAnimationFrame(updateBackground);
    };
    
    updateBackground();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [dimensions]);

  return (
    <div className="w-full h-full relative bg-white overflow-hidden" ref={containerRef}>
      {/* Background canvas with dots */}
      <canvas
        ref={backgroundCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
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
      
      <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
        {/* <div className="flex items-center space-x-2 backdrop-blur-sm rounded-lg px-3 h-9">
          <Switch id="mock-data" checked={showMockData} onCheckedChange={setShowMockData} />
          <Label htmlFor="mock-data" className="text-sm">Show Mock Data</Label>
        </div> */}
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div style={{ zIndex: 1, position: 'relative', pointerEvents: 'auto' }}>
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        enablePointerInteraction={true}

        // Colors & Style
        backgroundColor="transparent"
        
        // Track zoom and pan to update background
        onZoom={(zoomObj) => {
          if (graphRef.current) {
            const zoom = zoomObj.k || zoomObj;
            updateBackgroundTransform(zoom);
          }
        }}

        // Node Styling
        nodeRelSize={6}
        nodeVal={(node: any) => node.val || 1}
        nodeColor={getNodeColor}

        // Label/Text Styling
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          // Use title if available, otherwise use id
          const label = node.title || node.name || node.id;
          const fontSize = 12 / globalScale;

          // Calculate colors
          const color = getNodeColor(node);
          const isHighlighted = highlightNodes.has(node.id);
          const isHovered = hoverNode && (node.id === hoverNode.id || isHighlighted);
          const isHoverMode = Boolean(hoverNode && !lockedNodeId && nodeRelevance.size === 0);
          const isThematicHover = isHoverMode && hoverNode?.group === 1;
          const isDepartmentHover = isHoverMode && hoverNode?.group === 0;
          const isHoverHighlight =
            (isThematicHover || isDepartmentHover) && (node.id === hoverNode?.id || isHighlighted);
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
          // Always show labels for highlighted nodes (search results)
          let opacity = 0;
          
          if (isHovered || (isHighlighted && !isDimmed) || isRelevant) {
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
            
            let fontWeight = '400';
            if (node.group === 0) {
              fontWeight = '600';
            } else if (isHoverHighlight) {
              fontWeight = node.group === 1 ? '600' : '500';
            } else if (isHovered) {
              fontWeight = '600';
            }

            ctx.font = `${fontWeight} ${fontSize}px Sans-Serif`;
            
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

        // Physics - adjusted for proper grouping and stability
        d3VelocityDecay={0.3} // Lower friction to allow nodes to move to their positions
        d3AlphaDecay={0.01} // Slower decay to give more time for positioning
        cooldownTicks={400} // More ticks to allow proper positioning
        warmupTicks={0} // No warmup
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        onBackgroundClick={clearLockedHighlight}
      />
      </div>

      <GraphChat 
        onSearch={handleSearch} 
        onClear={handleClearSearch}
        loading={searchLoading}
        error={searchError}
        onQueryFocusChange={setIsQueryFocused}
        resultCount={searchResults.length}
        activeResultIndex={activeResultIndex}
        activeResultTitle={typeof activeResultIndex === "number" ? searchResults[activeResultIndex]?.title : undefined}
        onStepResult={handleResultStepper}
      />

      {/* AI Summary Notification - ChatGPT style */}
      {notificationMessage && showNotification && (
        <div 
          className={`absolute top-6 left-1/2 -translate-x-1/2 max-w-2xl w-[90%] z-50 transition-all duration-500 ease-in-out ${
            isFadingOut 
              ? 'opacity-0 -translate-y-4 pointer-events-none' 
              : 'opacity-100 translate-y-0 pointer-events-auto'
          }`}
        >
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              {/* Orion Logo/Avatar - using favicon */}
              <div className="shrink-0 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg overflow-hidden p-1">
                <Image 
                  src="/favicon.ico" 
                  alt="Orion" 
                  width={24} 
                  height={24}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              
              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {notificationMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

KnowledgeGraph.displayName = "KnowledgeGraph";

export default KnowledgeGraph;
