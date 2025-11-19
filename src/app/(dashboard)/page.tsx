import { Badge } from "@/components/ui/badge";
import { FeedCard, FeedItem } from "@/components/features/feed/feed-card";

const feedItems: FeedItem[] = [
  {
    id: "1",
    author: {
      name: "Sarah Chen",
      handle: "@schen_product",
      avatar: "https://github.com/shadcn.png", // Placeholder
      role: "Product Lead",
    },
    type: "article",
    timestamp: "2h ago",
    isRead: false,
    content: (
      <>
        <p className="mb-4">
          Found this interesting analysis on <span className="font-medium text-primary">#AI</span> adoption in enterprise workflows.
          Relevant for our Q4 roadmap, specifically the "Context-Aware" feature set.
        </p>
        <div className="rounded-lg border bg-muted/50 p-4">
           <p className="font-semibold text-base mb-2">The State of AI in SaaS 2025</p>
           <p className="text-muted-foreground line-clamp-2 leading-relaxed">
             Enterprise adoption is shifting from generative chat to integrated workflow automation. Key drivers are context retention and permission management...
           </p>
        </div>
      </>
    ),
    taggedUsers: [
      { name: "Alex Rivera", handle: "@arivera_eng" },
      { name: "Team Lead", handle: "@engineering" }
    ]
  },
  {
    id: "2",
    author: {
      name: "Alex Rivera",
      handle: "@arivera_eng",
      avatar: "", // Fallback
      role: "Engineering Manager",
    },
    type: "note",
    timestamp: "5h ago",
    isRead: true,
    content: (
      <p>
        Just pushed the new <span className="text-primary font-medium">Graph Visualization</span> engine to staging. 
        Performance is up 40% on large datasets. Please review before the demo tomorrow! 🚀
      </p>
    ),
    taggedUsers: [
      { name: "Sarah Chen", handle: "@schen_product" },
      { name: "Design Team", handle: "@design" }
    ]
  },
  {
    id: "3",
    author: {
      name: "Solon Bot",
      handle: "@solon_system",
      avatar: "", 
      role: "System",
    },
    type: "mention",
    timestamp: "1d ago",
    isRead: true,
    content: (
      <p>
        New mention in <span className="font-medium">#customer-feedback</span> on Slack.
        <br/>
        "Ideally, I'd like to see a breakdown of my team's knowledge gaps. Is that on the roadmap?"
      </p>
    ),
    taggedUsers: [
      { name: "Product Team", handle: "@product" }
    ]
  }
];

export default function DashboardPage() {
  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-6 md:px-12 md:py-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Feed</h1>
            <p className="text-muted-foreground text-base">
              Your personalized knowledge stream.
            </p>
          </div>
          <Badge variant="outline" className="font-mono px-3 py-1">Live</Badge>
        </div>
      </div>
      
      <div className="space-y-6 max-w-5xl mx-auto px-6 md:px-12 py-6 md:py-8">
        {feedItems.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
