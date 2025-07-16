import React from 'react';
import { ArrowLeft, Database, TrendingUp, Activity, Hash, Globe, Info, DollarSign, Users, Target, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProjectInfoPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
    {/* Header with back button */}
    <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center space-x-4">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-gray-400 hover:text-cyan-400 transition-colors duration-300"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Main Title */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl">
            <Info size={32} className="text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
          News Aggregator Frontend
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          This frontend is the user interface for the News Aggregator System, providing interactive dashboards and visualizations for exploring global news, topics, and entity relationships. It connects to a Supabase/Postgres backend, leveraging AI-powered feature extraction and topic modeling.
        </p>
      </div>

      {/* What the Website Does Section */}
      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
            <Target size={24} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">What the Website Does</h2>
        </div>
        
        <div className="grid gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex-shrink-0">
                <TrendingUp size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Home Page</h3>
                <p className="text-gray-300">Overview of the platform's capabilities. Quick links to the main dashboards: Latest News, Entity Network, Geo Heatmap, and Topic Hierarchy. Highlights real-time data, interactive networks, and AI-powered analysis.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex-shrink-0">
                <Globe size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">News Page</h3>
                <p className="text-gray-300">Displays a feed of the latest news articles. Supports filtering by country, entity, topic, and date. Each article card shows title, snippet, publisher, country, and images.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex-shrink-0">
                <Hash size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Topics Page</h3>
                <p className="text-gray-300">Visualizes the hierarchical structure of topics using an interactive chart. Shows statistics: number of macro topics, sub-topics, and topics. Users can drill down into topic categories.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-lg flex-shrink-0">
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Network Page</h3>
                <p className="text-gray-300">Interactive network graph of entities (people, organizations, locations) and their relationships. Visualizes co-occurrences and connections between entities in the news. Includes performance monitoring for large graphs.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex-shrink-0">
                <Globe size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Geo Page</h3>
                <p className="text-gray-300">(Currently a placeholder) 3D globe visualization using ECharts. Intended for future geo heatmaps of news density by country.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data and Queries Section */}
      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg">
            <Database size={24} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">What Data and Queries Are Used</h2>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">Actively Queried Tables/Views</h3>
          <div className="grid gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-300"><code className="bg-gray-700 px-2 py-1 rounded">news</code>: Used for displaying news articles and filtering by country, date, etc.</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-300"><code className="bg-gray-700 px-2 py-1 rounded">feature_entities</code>: Used for entity extraction, filtering news by entity, and building entity networks.</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-300"><code className="bg-gray-700 px-2 py-1 rounded">feature_engineering</code>: Used for sentiment analysis, linking entities/topics to news, and filtering.</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-300"><code className="bg-gray-700 px-2 py-1 rounded">meta_topic_groups & meta_topic_group_members</code>: Used for topic network visualizations and grouping topics.</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-300"><code className="bg-gray-700 px-2 py-1 rounded">sub_topic_groups_view & topic_hierarchy_view</code>: Used for hierarchical topic visualizations and topic-based filtering.</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-300"><code className="bg-gray-700 px-2 py-1 rounded">frequent_entities_materialized</code>: Used for entity filter options, entity statistics, and type filtering.</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Example Query Flows</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-cyan-400 pl-4">
              <h4 className="font-semibold text-cyan-400 mb-2">News Feed</h4>
              <p className="text-gray-300">Fetches from <code className="bg-gray-700 px-2 py-1 rounded">news</code>, with filters on country, date, entity (via <code className="bg-gray-700 px-2 py-1 rounded">feature_entities</code> and <code className="bg-gray-700 px-2 py-1 rounded">feature_engineering</code>), and topic (via <code className="bg-gray-700 px-2 py-1 rounded">topic_hierarchy_view</code>).</p>
            </div>
            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="font-semibold text-purple-400 mb-2">Entity Network</h4>
              <p className="text-gray-300">Fetches all entities from <code className="bg-gray-700 px-2 py-1 rounded">feature_entities</code>. Builds relationships based on shared <code className="bg-gray-700 px-2 py-1 rounded">feature_id</code> (co-occurrence in articles). Uses <code className="bg-gray-700 px-2 py-1 rounded">feature_engineering</code> for sentiment and article linkage.</p>
            </div>
            <div className="border-l-4 border-orange-400 pl-4">
              <h4 className="font-semibold text-orange-400 mb-2">Topic Hierarchy</h4>
              <p className="text-gray-300">Fetches topic structure from <code className="bg-gray-700 px-2 py-1 rounded">sub_topic_groups_view</code> and <code className="bg-gray-700 px-2 py-1 rounded">topic_hierarchy_view</code>. Fetches group details from <code className="bg-gray-700 px-2 py-1 rounded">meta_topic_groups</code>, <code className="bg-gray-700 px-2 py-1 rounded">meta_topic_group_members</code>.</p>
            </div>
            <div className="border-l-4 border-green-400 pl-4">
              <h4 className="font-semibold text-green-400 mb-2">Entity Stats</h4>
              <p className="text-gray-300">Aggregates from <code className="bg-gray-700 px-2 py-1 rounded">feature_entities</code>, <code className="bg-gray-700 px-2 py-1 rounded">feature_engineering</code>, and <code className="bg-gray-700 px-2 py-1 rounded">frequent_entities_materialized</code>.</p>
            </div>
          </div>
        </div>
      </div>

      {/* TODO Section */}
      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
            <Zap size={24} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">TODO: Additional KPIs & Dashboards</h2>
        </div>
        
        <div className="grid gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">News Page Dynamic Filters</h3>
            <p className="text-gray-300">Re-implement dynamic filtering functionality for the news page. Add filters for country, entity, topic, and date range selection. Ensure filters work seamlessly with the existing news feed and provide real-time filtering capabilities.</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Geo Heatmap</h3>
            <p className="text-gray-300">Visualize article density by country using the <code className="bg-gray-700 px-2 py-1 rounded">news</code> table. Show trends over time or by topic.</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Publisher Analytics</h3>
            <p className="text-gray-300">Use the <code className="bg-gray-700 px-2 py-1 rounded">publisher</code> field in <code className="bg-gray-700 px-2 py-1 rounded">news</code> and <code className="bg-gray-700 px-2 py-1 rounded">frequent_entities_materialized</code> to show top publishers, their sentiment, and coverage diversity.</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Sentiment Dashboards</h3>
            <p className="text-gray-300">Aggregate sentiment over time, by country, topic, or entity using <code className="bg-gray-700 px-2 py-1 rounded">feature_engineering</code>. Show sentiment trends and outliers.</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Event & Key Event Analytics</h3>
            <p className="text-gray-300">Visualize major events from <code className="bg-gray-700 px-2 py-1 rounded">feature_key_events</code> (not currently used in frontend). Show timelines, participants, and event sentiment.</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Entity Relationship Deep Dives</h3>
            <p className="text-gray-300">Use <code className="bg-gray-700 px-2 py-1 rounded">feature_relationships</code> to show more nuanced relationships (e.g., subject-relation-object triples).</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">User Analytics</h3>
            <p className="text-gray-300">Use <code className="bg-gray-700 px-2 py-1 rounded">app_users</code> for user activity, favorite topics/entities, and personalized dashboards.</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Meta/Materialized Views</h3>
            <p className="text-gray-300">Leverage <code className="bg-gray-700 px-2 py-1 rounded">v_meta_topic_groupings</code>, <code className="bg-gray-700 px-2 py-1 rounded">meta_topic_groups_view</code>, and <code className="bg-gray-700 px-2 py-1 rounded">topic_hierarchy_view</code> for richer analytics and cross-sectional dashboards.</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Performance & Coverage Monitoring</h3>
            <p className="text-gray-300">Show ingestion rates, API error rates, and system health (using backend logs or status tables).</p>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-lg">
            <Database size={24} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Summary Table: Backend Tables/Views Used</h2>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-white">Table/View</th>
                  <th className="px-6 py-4 font-semibold text-white">Used in Frontend?</th>
                  <th className="px-6 py-4 font-semibold text-white">Purpose/Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">news</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Yes</span></td>
                  <td className="px-6 py-4 text-gray-300">News feed, filters</td>
                </tr>
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">subnews</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">No</span></td>
                  <td className="px-6 py-4 text-gray-300">(Potential for related articles)</td>
                </tr>
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">feature_engineering</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Yes</span></td>
                  <td className="px-6 py-4 text-gray-300">Sentiment, entity/topic linkage</td>
                </tr>
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">feature_entities</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Yes</span></td>
                  <td className="px-6 py-4 text-gray-300">Entity extraction, network, filters</td>
                </tr>
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">feature_key_events</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">No</span></td>
                  <td className="px-6 py-4 text-gray-300">(Potential for event dashboards)</td>
                </tr>
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">feature_relationships</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">No</span></td>
                  <td className="px-6 py-4 text-gray-300">(Potential for relationship deep dives)</td>
                </tr>
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">meta_topic_groups</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Yes</span></td>
                  <td className="px-6 py-4 text-gray-300">Topic network, hierarchy</td>
                </tr>
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">meta_topic_group_members</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Yes</span></td>
                  <td className="px-6 py-4 text-gray-300">Topic network, hierarchy</td>
                </tr>
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">sub_topic_groups_view</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Yes</span></td>
                  <td className="px-6 py-4 text-gray-300">Topic hierarchy, stats</td>
                </tr>
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">topic_hierarchy_view</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Yes</span></td>
                  <td className="px-6 py-4 text-gray-300">Topic filtering, hierarchy</td>
                </tr>
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">v_meta_topic_groupings</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">No</span></td>
                  <td className="px-6 py-4 text-gray-300">(Potential for advanced dashboards)</td>
                </tr>
                <tr className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 font-mono text-cyan-400">app_users</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">No</span></td>
                  <td className="px-6 py-4 text-gray-300">(Potential for user analytics)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Project Notes & Reflections */}
      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-pink-400 to-rose-500 rounded-lg">
            <Users size={24} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Project Notes & Reflections</h2>
        </div>
        
        <div className="grid gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-pink-500/30 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex-shrink-0">
                <DollarSign size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Costs & API Usage</h3>
                <p className="text-gray-300">We spent roughly $15 in 3 days for infrastructure and compute. Additionally, we spent $25 for Google News API access (10,000 requests purchased, not all used).</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-pink-500/30 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex-shrink-0">
                <Globe size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Coverage</h3>
                <p className="text-gray-300">The system checks news for 40 countries, prioritized by population size.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-pink-500/30 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex-shrink-0">
                <Target size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Experimental Goals</h3>
                <p className="text-gray-300">This project was an experiment in large-scale news aggregation, entity extraction, and topic modeling. We aimed to explore the use of DeepSeek for translation and multi-step categorization, leveraging prompt engineering for better results. The project demonstrates the potential of combining AI, prompt engineering, and scalable data pipelines.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-pink-500/30 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex-shrink-0">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Future Directions</h3>
                <p className="text-gray-300">There is significant potential to develop many more interesting KPIs and feature engineering based on the data collected. With more time, we could apply advanced machine learning and analytics to uncover deeper insights. The project could become even more interesting if fully self-hosted, using local AI models for translation, categorization, and analysis.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-gray-700/50">
        <p className="text-gray-400">
          Built with React, TypeScript, and Tailwind CSS • Powered by AI and Big Data
        </p>
      </div>
    </div>
  </div>
);

export default ProjectInfoPage; 