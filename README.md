# Orbit

![Splash](public/splash.png)

**A collaborative "knowledge brain" for external information**

Teams constantly find valuable articles, posts, and resources—but they disappear into Slack, email, and DMs. At the same time, a single article *should* mean something different to an engineer, a marketer, or a founder.

Orbit is a collaborative knowledge management platform that captures everything your organization encounters and automatically rewrites each piece into versions tailored to every teammate's role, expertise, and preferences.

## 🎯 What Problem Does It Solve?

Modern teams are drowning in information:
- **Link chaos**: Valuable articles get lost in Slack threads, emails, and DMs
- **One-size-fits-all content**: The same article should mean different things to different roles
- **Fragmented knowledge**: No centralized system of record for external knowledge
- **Cognitive overload**: Teams can't process the firehose of information effectively

Orbit solves this by:
- **Centralizing** all external content your team discovers
- **Personalizing** explanations per person (engineering vs marketing vs sales) as a default behavior
- **Building** a living knowledge graph that connects insights across your organization
- **Enabling** collaborative discussion where knowledge lives


## 🧠 Tech Stack

Orbit leverages AI and graph technologies to deliver personalized knowledge at scale:

- **Google Gemini 3 Pro/2.5 Flash**: Powers role-specific content personalization and insight generation, rewriting articles for different audiences (engineering, product, marketing, leadership). Also used for fast query enhancement and semantic understanding for natural language search.
- **Gemini text-embedding-004**: SOTA vector embeddings for semantic search and content similarity
- **Vector Similarity Search**: PostgreSQL-based vector search with cosine similarity for finding related content
- **Knowledge Graph Construction**: Automatic graph building from content relationships, tags, and semantic connections
- **Real-time Collaborative Editing**: Tiptap with Y.js for live collaborative document editing
- **Force-Directed Graph Visualization**: Interactive D3.js-based graph rendering for exploring knowledge connections
- **Supabase Edge Functions**: Serverless Deno runtime for AI processing and content ingestion

## ✨ Key Features

### 1. **Context-Aware Article Capture**
- Add articles via Chrome extension or direct URL
- Automatically extracts and processes content
- Supports notes and team member mentions during ingestion

### 2. **Personalized Perspective Layers**
Each article is automatically rewritten for different roles:
- **For Engineering**: Highlights technical dependencies, architectural implications, and code snippets
- **For Product**: Focuses on user value, feature feasibility, and roadmap impact
- **For Marketing**: Extracts messaging opportunities, market insights, and campaign ideas
- **For Leadership**: Emphasizes strategic opportunities, risks, and business outcomes

### 3. **Interactive Knowledge Graph**
- Visual representation of your team's knowledge base
- Shows connections between articles, topics, and concepts
- Natural language search to explore the graph
- Filter by tags, topics, and relevance

### 4. **Collaborative Article Reader**
- View articles with role-specific insights
- Highlight text and add comments
- Mention team members in discussions
- Real-time collaborative editing
- Side-by-side view of original content and personalized insights

### 5. **Team Onboarding**
- Multi-step onboarding flow to understand team context
- Captures roles, responsibilities, interests, and preferences
- Enables personalized content delivery from day one

## 🚀 Getting Started

### Deployment

You can also skip launching the platform yourself, creating an account on our deployed platform at [link](https://orbit-xi-gules.vercel.app/onboarding?token=603d38d997c10173f8978c8ce2886d75546c49e174124c30043e9fa14a09aac8). You can also skip the creation (but highly recommended to do!) with the credentials:

**Demo Account Credentials:**
- **Email**: `demoaccount@orbit.com`
- **Password**: `orbitdemo123`

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (or use the provided configuration)
- Chrome browser (for extension)

### Installation

1. **Clone the repository**
   ```bash
   cd orbit-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables** (optional)
   
   The app uses default Supabase configuration, but you can override it by creating a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Quick Start: Try the Onboarding Flow

You can experience the full onboarding flow with this demo link:

**Onboarding Link**: [http://localhost:3000/onboarding?token=603d38d997c10173f8978c8ce2886d75546c49e174124c30043e9fa14a09aac8](http://localhost:3000/onboarding?token=603d38d997c10173f8978c8ce2886d75546c49e174124c30043e9fa14a09aac8)

This will walk you through the complete onboarding experience where you'll:
- Set up your profile and role
- Configure your interests and preferences
- Join a team
- See how personalized insights are generated based on your profile

### Demo Account (Skip Onboarding)

If you prefer to skip onboarding and jump straight into Orbit, you can use this pre-configured demo account:

**Demo Account Credentials:**
- **Email**: `demoaccount@orbit.com`
- **Password**: `orbitdemo123`

**Profile Details:**
- **Role**: Product Designer (also responsible for strategy & vision)
- **Company**: [Omen](https://www.omen.so) - An AI copilot that automatically finds and tests high-impact UX improvements for e-commerce stores, turning their existing traffic into compounding revenue growth

Simply navigate to the login page and sign in with these credentials to explore Orbit with a pre-configured profile that demonstrates how personalized insights work for a product designer role.

### Install the Chrome Extension

The Chrome extension is located in the `public/chrome-extension/` directory.

1. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Navigate to `orbit-frontend/public/chrome-extension/` and select that directory

2. **Authenticate**
   - Click the Orbit extension icon in your browser toolbar
   - Sign in with your Orbit account
   - Select your team

## 📖 How to Use Orbit

### Adding Articles

#### Chrome Extension
1. Navigate to any article or webpage you want to save
2. Click the Orbit extension icon in your browser toolbar
3. Optionally add:
   - A note explaining why this matters
   - Mentions of team members who should see this
4. Click "Add to Orbit"
5. The article will be processed and appear in your team's knowledge base


### Viewing Articles

1. **From the Dashboard**
   - The main dashboard shows your team's knowledge graph
   - Click on any article node to view it
   - Use the search bar to find specific articles

2. **Article Reader Features**
   - **Insights Tab**: View role-specific personalized insights
   - **Original Tab**: Read the original article content
   - **Comments Sidebar**: See and add comments, reply to discussions
   - **Highlights**: Select text to highlight and annotate
   - **Mentions**: Use `@username` to mention team members

### Exploring the Knowledge Graph

1. **Navigate the Graph**
   - Click and drag nodes to explore connections
   - Zoom in/out using the controls or mouse wheel
   - Click on nodes to view article details

2. **Search the Graph**
   - Use the search bar to ask natural language questions
   - The graph will highlight relevant nodes
   - Click search results to navigate to articles

3. **Filter Content**
   - Filter by tags, topics, or date ranges
   - Toggle between different view modes
   - Focus on specific categories or themes

### Collaborating

1. **Add Comments**
   - Open any article
   - Select text to highlight (optional)
   - Add a comment in the sidebar
   - Mention teammates using `@username`

2. **Reply to Comments**
   - Click on any comment to reply
   - Thread discussions around specific highlights
   - Get notified when mentioned

3. **Share Insights**
   - Use the perspective switcher to see how others view the same content
   - Share article links with your team
   - Export insights for presentations

### Team Management

1. **Invite Team Members**
   - Generate invite links from your team settings
   - New members go through onboarding to set preferences
   - Their personalized feed will be ready immediately

2. **Configure Team Settings**
   - Set team name and description
   - Manage roles and permissions
   - Configure integrations

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Editor**: Tiptap (rich text editing with collaboration)
- **Graph Visualization**: react-force-graph-2d (D3.js-based force-directed graphs)
- **Backend**: Supabase (PostgreSQL with pgvector, Edge Functions, Auth)
- **AI/ML**: 
  - Google Gemini 3 Pro Preview (insight generation)
  - Google Gemini 2.5 Flash (query enhancement)
  - Gemini text-embedding-004 (vector embeddings)
  - Vector similarity search (semantic search)

### Project Structure

```
orbit-frontend/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/             # Authentication pages
│   │   │   ├── login/          # Login page
│   │   │   └── onboarding/     # Team onboarding flow
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   │   ├── page.tsx        # Main knowledge graph view
│   │   │   ├── graph/           # Graph-specific view
│   │   │   └── profile/        # User profile
│   │   └── article/[id]/        # Article reader page
│   ├── components/
│   │   ├── features/           # Feature-specific components
│   │   │   ├── article/       # Article reader, comments, highlights
│   │   │   ├── graph/          # Knowledge graph visualization
│   │   │   └── onboarding/     # Onboarding flow components
│   │   ├── shared/             # Shared components (navbar, sidebar)
│   │   └── ui/                 # Reusable UI components
│   ├── contexts/               # React contexts (Auth, etc.)
│   └── lib/                    # Utilities and Supabase client
└── public/                      # Static assets
    └── chrome-extension/        # Chrome extension files
```

### Key Supabase Functions

- `ingest_article`: Processes and stores new articles
- `get_article`: Retrieves article with personalized insights
- `get_graph`: Generates knowledge graph data
- `search_natural`: Natural language search
- `generate_insights`: Creates role-specific insights
- `create_team`: Team creation
- `join_team`: Team membership management

## 🎨 Customization

### Personalization Settings

During onboarding, users configure:
- **Department & Role**: Engineering, Product, Marketing, etc.
- **Responsibilities**: What they work on day-to-day
- **Interests**: Topics they care about
- **Consumption Preferences**: How they prefer to consume content

These settings drive the personalized insights for each article.

### Team Configuration

Teams can configure:
- Team name and description
- Default tags and categories
- Integration settings
- Access controls

## 🔒 Security & Privacy

- Authentication via Supabase Auth
- Row-level security (RLS) policies protect team data
- All API calls require valid authentication tokens
- Team data is isolated and private

## 🚧 Development

### Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

**Built for teams who think better together.** 🧠✨
