export const generateData = () => {
  const nodes = [
    // Main Nodes (5)
    { id: "Marketing", group: 0, val: 30 },
    { id: "Sales", group: 0, val: 30 },
    { id: "Tech", group: 0, val: 30 },
    { id: "Product", group: 0, val: 30 },
    { id: "Finance", group: 0, val: 30 },

    // --- Marketing ---
    { id: "SEO", group: 1, val: 15 },
    { id: "Social Media", group: 1, val: 15 },
    { id: "Content Strategy", group: 1, val: 15 },
    // SEO Articles
    { id: "Ranking on Google", group: 2, val: 5 },
    { id: "Keyword Research", group: 2, val: 5 },
    { id: "Backlink Strategy", group: 2, val: 5 },
    { id: "Local SEO", group: 2, val: 5 },
    // Social Media Articles
    { id: "Instagram Growth", group: 2, val: 5 },
    { id: "TikTok Trends", group: 2, val: 5 },
    { id: "LinkedIn B2B", group: 2, val: 5 },
    { id: "Twitter Algorithms", group: 2, val: 5 },
    // Content Articles
    { id: "Viral Content", group: 2, val: 5 },
    { id: "Blog Calendar", group: 2, val: 5 },
    { id: "Video Marketing", group: 2, val: 5 },
    { id: "Newsletter Growth", group: 2, val: 5 },

    // --- Sales ---
    { id: "Outreach", group: 1, val: 15 },
    { id: "Closing", group: 1, val: 15 },
    { id: "CRM", group: 1, val: 15 },
    // Outreach Articles
    { id: "Cold Emailing 101", group: 2, val: 5 },
    { id: "LinkedIn DM Scripts", group: 2, val: 5 },
    { id: "Cold Call Scripts", group: 2, val: 5 },
    { id: "Follow-up Sequences", group: 2, val: 5 },
    // Closing Articles
    { id: "Negotiation Tactics", group: 2, val: 5 },
    { id: "Handling Objections", group: 2, val: 5 },
    { id: "Pricing Psychology", group: 2, val: 5 },
    { id: "Contract Reviews", group: 2, val: 5 },
    // CRM Articles
    { id: "HubSpot vs Salesforce", group: 2, val: 5 },
    { id: "Pipeline Management", group: 2, val: 5 },
    { id: "Lead Scoring", group: 2, val: 5 },
    { id: "Data Hygiene", group: 2, val: 5 },

    // --- Tech ---
    { id: "Frontend", group: 1, val: 15 },
    { id: "Backend", group: 1, val: 15 },
    { id: "AI / ML", group: 1, val: 15 },
    // Frontend Articles
    { id: "React 19 Features", group: 2, val: 5 },
    { id: "Tailwind vs CSS", group: 2, val: 5 },
    { id: "Next.js 14", group: 2, val: 5 },
    { id: "Web Performance", group: 2, val: 5 },
    // Backend Articles
    { id: "Scalable APIs", group: 2, val: 5 },
    { id: "PostgreSQL Optimization", group: 2, val: 5 },
    { id: "Microservices", group: 2, val: 5 },
    { id: "Serverless Functions", group: 2, val: 5 },
    // AI/ML Articles
    { id: "LLMs in Production", group: 2, val: 5 },
    { id: "RAG Architectures", group: 2, val: 5 },
    { id: "Prompt Engineering", group: 2, val: 5 },
    { id: "OpenAI API", group: 2, val: 5 },

    // --- Product ---
    { id: "Roadmap", group: 1, val: 15 },
    { id: "UX Design", group: 1, val: 15 },
    { id: "User Research", group: 1, val: 15 },
    // Roadmap Articles
    { id: "Q4 Goals", group: 2, val: 5 },
    { id: "Prioritization Frameworks", group: 2, val: 5 },
    { id: "Stakeholder Management", group: 2, val: 5 },
    { id: "Release Planning", group: 2, val: 5 },
    // UX Articles
    { id: "Accessibility Standards", group: 2, val: 5 },
    { id: "Mobile First Design", group: 2, val: 5 },
    { id: "Dark Mode UI", group: 2, val: 5 },
    { id: "Figma Prototyping", group: 2, val: 5 },
    // Research Articles
    { id: "User Interviews", group: 2, val: 5 },
    { id: "Survey Design", group: 2, val: 5 },
    { id: "A/B Testing", group: 2, val: 5 },
    { id: "Persona Building", group: 2, val: 5 },

    // --- Finance ---
    { id: "Budgeting", group: 1, val: 15 },
    { id: "Investments", group: 1, val: 15 },
    { id: "Payroll", group: 1, val: 15 },
    // Budgeting Articles
    { id: "2025 Forecast", group: 2, val: 5 },
    { id: "Cost Cutting", group: 2, val: 5 },
    { id: "OpEx vs CapEx", group: 2, val: 5 },
    { id: "Burn Rate Analysis", group: 2, val: 5 },
    // Investment Articles
    { id: "Seed Funding", group: 2, val: 5 },
    { id: "Series A Prep", group: 2, val: 5 },
    { id: "Venture Capital", group: 2, val: 5 },
    { id: "Treasury Management", group: 2, val: 5 },
    // Payroll Articles
    { id: "Tax Compliance", group: 2, val: 5 },
    { id: "Global Compliance", group: 2, val: 5 },
    { id: "Benefits Packages", group: 2, val: 5 },
    { id: "Contractor Management", group: 2, val: 5 },
  ];

  const links = [
    // Ring connection for main nodes
    { source: "Marketing", target: "Sales" },
    { source: "Sales", target: "Finance" },
    { source: "Finance", target: "Product" },
    { source: "Product", target: "Tech" },
    { source: "Tech", target: "Marketing" },

    // --- Marketing Links ---
    { source: "Marketing", target: "SEO" },
    { source: "Marketing", target: "Social Media" },
    { source: "Marketing", target: "Content Strategy" },
    // SEO
    { source: "SEO", target: "Ranking on Google" },
    { source: "SEO", target: "Keyword Research" },
    { source: "SEO", target: "Backlink Strategy" },
    { source: "SEO", target: "Local SEO" },
    // Social Media
    { source: "Social Media", target: "Instagram Growth" },
    { source: "Social Media", target: "TikTok Trends" },
    { source: "Social Media", target: "LinkedIn B2B" },
    { source: "Social Media", target: "Twitter Algorithms" },
    // Content
    { source: "Content Strategy", target: "Viral Content" },
    { source: "Content Strategy", target: "Blog Calendar" },
    { source: "Content Strategy", target: "Video Marketing" },
    { source: "Content Strategy", target: "Newsletter Growth" },

    // --- Sales Links ---
    { source: "Sales", target: "Outreach" },
    { source: "Sales", target: "Closing" },
    { source: "Sales", target: "CRM" },
    // Outreach
    { source: "Outreach", target: "Cold Emailing 101" },
    { source: "Outreach", target: "LinkedIn DM Scripts" },
    { source: "Outreach", target: "Cold Call Scripts" },
    { source: "Outreach", target: "Follow-up Sequences" },
    // Closing
    { source: "Closing", target: "Negotiation Tactics" },
    { source: "Closing", target: "Handling Objections" },
    { source: "Closing", target: "Pricing Psychology" },
    { source: "Closing", target: "Contract Reviews" },
    // CRM
    { source: "CRM", target: "HubSpot vs Salesforce" },
    { source: "CRM", target: "Pipeline Management" },
    { source: "CRM", target: "Lead Scoring" },
    { source: "CRM", target: "Data Hygiene" },

    // --- Tech Links ---
    { source: "Tech", target: "Frontend" },
    { source: "Tech", target: "Backend" },
    { source: "Tech", target: "AI / ML" },
    // Frontend
    { source: "Frontend", target: "React 19 Features" },
    { source: "Frontend", target: "Tailwind vs CSS" },
    { source: "Frontend", target: "Next.js 14" },
    { source: "Frontend", target: "Web Performance" },
    // Backend
    { source: "Backend", target: "Scalable APIs" },
    { source: "Backend", target: "PostgreSQL Optimization" },
    { source: "Backend", target: "Microservices" },
    { source: "Backend", target: "Serverless Functions" },
    // AI/ML
    { source: "AI / ML", target: "LLMs in Production" },
    { source: "AI / ML", target: "RAG Architectures" },
    { source: "AI / ML", target: "Prompt Engineering" },
    { source: "AI / ML", target: "OpenAI API" },

    // --- Product Links ---
    { source: "Product", target: "Roadmap" },
    { source: "Product", target: "UX Design" },
    { source: "Product", target: "User Research" },
    // Roadmap
    { source: "Roadmap", target: "Q4 Goals" },
    { source: "Roadmap", target: "Prioritization Frameworks" },
    { source: "Roadmap", target: "Stakeholder Management" },
    { source: "Roadmap", target: "Release Planning" },
    // UX
    { source: "UX Design", target: "Accessibility Standards" },
    { source: "UX Design", target: "Mobile First Design" },
    { source: "UX Design", target: "Dark Mode UI" },
    { source: "UX Design", target: "Figma Prototyping" },
    // Research
    { source: "User Research", target: "User Interviews" },
    { source: "User Research", target: "Survey Design" },
    { source: "User Research", target: "A/B Testing" },
    { source: "User Research", target: "Persona Building" },

    // --- Finance Links ---
    { source: "Finance", target: "Budgeting" },
    { source: "Finance", target: "Investments" },
    { source: "Finance", target: "Payroll" },
    // Budgeting
    { source: "Budgeting", target: "2025 Forecast" },
    { source: "Budgeting", target: "Cost Cutting" },
    { source: "Budgeting", target: "OpEx vs CapEx" },
    { source: "Budgeting", target: "Burn Rate Analysis" },
    // Investments
    { source: "Investments", target: "Seed Funding" },
    { source: "Investments", target: "Series A Prep" },
    { source: "Investments", target: "Venture Capital" },
    { source: "Investments", target: "Treasury Management" },
    // Payroll
    { source: "Payroll", target: "Tax Compliance" },
    { source: "Payroll", target: "Global Compliance" },
    { source: "Payroll", target: "Benefits Packages" },
    { source: "Payroll", target: "Contractor Management" },

    // --- Cross-Department Links (Many-to-Many) ---
    // Overlapping Subtopics
    { source: "Tech", target: "SEO" },              // Tech team helps with SEO technicals
    { source: "Product", target: "UX Design" },     // UX is shared
    { source: "Tech", target: "UX Design" },        // Frontend dev involves UX
    { source: "Marketing", target: "User Research" }, // Marketing needs user insights
    { source: "Sales", target: "Pricing Psychology" }, // Sales uses pricing psychology
    { source: "Marketing", target: "Pricing Psychology" }, // Marketing sets pricing strategy
    { source: "Finance", target: "2025 Forecast" },
    { source: "Sales", target: "2025 Forecast" },   // Sales targets feed forecast

    // Overlapping Articles
    { source: "Content Strategy", target: "Ranking on Google" }, // Content drives ranking
    { source: "Social Media", target: "Viral Content" },
    { source: "SEO", target: "Web Performance" },   // Site speed affects SEO
    { source: "Frontend", target: "Accessibility Standards" }, // Devs implement accessibility
    { source: "Product", target: "Release Planning" },
    { source: "Tech", target: "Release Planning" }, // Engineering schedule
  ];

  return { nodes, links };
};
