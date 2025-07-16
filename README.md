# News Aggregator Frontend

This frontend is the user interface for the News Aggregator System, providing interactive dashboards and visualizations for exploring global news, topics, and entity relationships. It connects to a Supabase/Postgres backend, leveraging AI-powered feature extraction and topic modeling.

---

## What the Website Does

### Main Features & Pages

- **Home Page**:  
  - Overview of the platform’s capabilities.
  - Quick links to the main dashboards: Latest News, Entity Network, Geo Heatmap, and Topic Hierarchy.
  - Highlights real-time data, interactive networks, and AI-powered analysis.

- **News Page**:  
  - Displays a feed of the latest news articles.
  - Supports filtering by country, entity, topic, and date.
  - Each article card shows title, snippet, publisher, country, and images.

- **Topics Page**:  
  - Visualizes the hierarchical structure of topics using an interactive chart.
  - Shows statistics: number of macro topics, sub-topics, and topics.
  - Users can drill down into topic categories.

- **Network Page**:  
  - Interactive network graph of entities (people, organizations, locations) and their relationships.
  - Visualizes co-occurrences and connections between entities in the news.
  - Includes performance monitoring for large graphs.

- **Geo Page**:  
  - (Currently a placeholder) 3D globe visualization using ECharts.
  - Intended for future geo heatmaps of news density by country.

---

## What Data and Queries Are Used

### Actively Queried Tables/Views

- **news**:  
  - Used for displaying news articles and filtering by country, date, etc.

- **feature_entities**:  
  - Used for entity extraction, filtering news by entity, and building entity networks.

- **feature_engineering**:  
  - Used for sentiment analysis, linking entities/topics to news, and filtering.

- **meta_topic_groups** & **meta_topic_group_members**:  
  - Used for topic network visualizations and grouping topics.

- **sub_topic_groups_view** & **topic_hierarchy_view**:  
  - Used for hierarchical topic visualizations and topic-based filtering.

- **frequent_entities_materialized**:  
  - Used for entity filter options, entity statistics, and type filtering.

### Example Query Flows

- **News Feed**:  
  - Fetches from `news`, with filters on country, date, entity (via `feature_entities` and `feature_engineering`), and topic (via `topic_hierarchy_view`).

- **Entity Network**:  
  - Fetches all entities from `feature_entities`.
  - Builds relationships based on shared `feature_id` (co-occurrence in articles).
  - Uses `feature_engineering` for sentiment and article linkage.

- **Topic Hierarchy**:  
  - Fetches topic structure from `sub_topic_groups_view` and `topic_hierarchy_view`.
  - Fetches group details from `meta_topic_groups`, `meta_topic_group_members`.

- **Entity Stats**:  
  - Aggregates from `feature_entities`, `feature_engineering`, and `frequent_entities_materialized`.

---

## TODO: Additional KPIs & Dashboards

Here are some ideas for future development, based on unused tables/views and potential analytics:

- **News Page Dynamic Filters**:  
  - Re-implement dynamic filtering functionality for the news page.
  - Add filters for country, entity, topic, and date range selection.
  - Ensure filters work seamlessly with the existing news feed and provide real-time filtering capabilities.

- **Geo Heatmap**:  
  - Visualize article density by country using the `news` table.
  - Show trends over time or by topic.

- **Publisher Analytics**:  
  - Use the `publisher` field in `news` and `frequent_entities_materialized` to show top publishers, their sentiment, and coverage diversity.

- **Sentiment Dashboards**:  
  - Aggregate sentiment over time, by country, topic, or entity using `feature_engineering`.
  - Show sentiment trends and outliers.

- **Event & Key Event Analytics**:  
  - Visualize major events from `feature_key_events` (not currently used in frontend).
  - Show timelines, participants, and event sentiment.

- **Entity Relationship Deep Dives**:  
  - Use `feature_relationships` to show more nuanced relationships (e.g., subject-relation-object triples).

- **User Analytics (if authentication is enabled)**:  
  - Use `app_users` for user activity, favorite topics/entities, and personalized dashboards.

- **Meta/Materialized Views**:  
  - Leverage `v_meta_topic_groupings`, `meta_topic_groups_view`, and `topic_hierarchy_view` for richer analytics and cross-sectional dashboards.

- **Performance & Coverage Monitoring**:  
  - Show ingestion rates, API error rates, and system health (using backend logs or status tables).

---

## Summary Table: Backend Tables/Views Used

| Table/View                    | Used in Frontend? | Purpose/Notes                                      |
|-------------------------------|:-----------------:|----------------------------------------------------|
| news                          | Yes              | News feed, filters                                 |
| subnews                       | No               | (Potential for related articles)                   |
| feature_engineering           | Yes              | Sentiment, entity/topic linkage                    |
| feature_entities              | Yes              | Entity extraction, network, filters                |
| feature_key_events            | No               | (Potential for event dashboards)                   |
| feature_relationships         | No               | (Potential for relationship deep dives)            |
| meta_topic_groups             | Yes              | Topic network, hierarchy                           |
| meta_topic_group_members      | Yes              | Topic network, hierarchy                           |
| sub_topic_groups              | Indirectly       | Used via views                                     |
| sub_topic_group_members       | Indirectly       | Used via views                                     |
| frequent_entities             | No (raw table)   | (Materialized view used instead)                   |
| frequent_entities_materialized| Yes              | Entity stats, filters                              |
| meta_topic_groups_view        | Indirectly       | (Potential for richer analytics)                   |
| sub_topic_groups_view         | Yes              | Topic hierarchy, stats                             |
| topic_hierarchy_view          | Yes              | Topic filtering, hierarchy                         |
| v_meta_topic_groupings        | No               | (Potential for advanced dashboards)                |
| app_users                     | No               | (Potential for user analytics)                     |

---

## How to Contribute

- See the TODO list above for ideas.
- Consider adding new visualizations for unused tables/views.
- Suggest new KPIs or dashboards based on available data.

---

## Project Notes & Reflections

- **Costs & API Usage:**
  - We spent roughly $15 in 3 days for infrastructure and compute.
  - Additionally, we spent $25 for Google News API access (10,000 requests purchased, not all used).

- **Coverage:**
  - The system checks news for 40 countries, prioritized by population size.

- **Experimental Goals:**
  - This project was an experiment in large-scale news aggregation, entity extraction, and topic modeling.
  - We aimed to explore the use of DeepSeek for translation and multi-step categorization, leveraging prompt engineering for better results.
  - The project demonstrates the potential of combining AI, prompt engineering, and scalable data pipelines.

- **Future Directions:**
  - There is significant potential to develop many more interesting KPIs and feature engineering based on the data collected.
  - With more time, we could apply advanced machine learning and analytics to uncover deeper insights.
  - The project could become even more interesting if fully self-hosted, using local AI models for translation, categorization, and analysis.

---
