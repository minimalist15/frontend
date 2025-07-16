# News Aggregator System

A scalable, modular system for aggregating, analyzing, and organizing news from around the world. The system fetches news, extracts features using AI, groups topics into meta-categories and sub-categories, and stores everything in a normalized database.

---

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Setup & Installation](#setup--installation)
- [Running the System](#running-the-system)
- [Component Details](#component-details)
- [Monitoring & Logs](#monitoring--logs)
- [Maintenance & Utilities](#maintenance--utilities)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

This project is a full-stack news aggregation and analysis pipeline. It:
- Fetches news from Google News API for 40+ countries.
- Translates and processes articles using DeepSeek AI.
- Extracts topics, entities, events, and sentiment.
- Groups topics into meta-topic groups and sub-topic groups.
- Stores all data in a normalized Supabase (Postgres) database.

---

## System Architecture

The orchestrator (`start_orchestrator.py`) runs five main threads:
1. **News Aggregator**: Fetches news every hour.
2. **Feature Engineering**: Extracts features from news every 5 minutes.
3. **Topic Aggregator**: Groups topics into meta-topic groups every 5 minutes.
4. **Sub-Topic Aggregator**: Further sub-categorizes topics every 10 minutes.
5. **Status Monitor**: Logs system/database status every 10 minutes.

Each component is modular and can be run independently.

---

## Database Schema

The system uses a normalized PostgreSQL schema (via Supabase) to store news, features, topics, users, and analytics. Below is a summary of the main tables, materialized views, and their purposes.

### Schema Diagram

![Database Schema Diagram](./schema_diagram.png)
*_(Add your image file as `schema_diagram.png` in the repo root, or update the path as needed)_*

---

### Core Tables

| Table | Description |
|-------|-------------|
| **news** | Main news articles, one per unique news URL. |
| **subnews** | Related sub-articles, linked to a parent news article. |
| **feature_engineering** | Extracted features (topic, sentiment, etc.) for each news/subnews. |
| **feature_entities** | Named entities (people, orgs, locations, etc.) extracted from articles. |
| **feature_key_events** | Key events and their details, linked to features. |
| **feature_relationships** | Relationships between entities in articles. |
| **app_users** | Application users, with roles, login, and status. |

---

### Topic Organization Tables

| Table | Description |
|-------|-------------|
| **meta_topic_groups** | High-level topic categories (e.g., "Politics", "Economy"). |
| **meta_topic_group_members** | Assigns features (topics) to meta-topic groups. |
| **sub_topic_groups** | Sub-categories within meta-topic groups. |
| **sub_topic_group_members** | Assigns features to sub-topic groups. |

---

### Analytics & Materialized Views

| Table/View | Description |
|------------|-------------|
| **frequent_entities** | Aggregated stats on most frequent entities (with rolling sentiment, country/publisher counts, etc.). |
| **frequent_entities_materialized** | Materialized view for fast querying of entity stats. |
| **meta_topic_groups_view** | View joining meta-topic groups and their members for easy querying. |
| **sub_topic_groups_view** | View joining sub-topic groups and their members. |
| **topic_hierarchy_view** | Full hierarchy: meta-group → sub-group → topic, with all context. |
| **v_meta_topic_groupings** | Enriched view for analytics, including news/subnews, topics, sentiment, and groupings. |

---

### Full SQL Schema

```sql


-- NEWS
CREATE TABLE news (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    country text NOT NULL,
    language text NOT NULL,
    timestamp bigint NOT NULL,
    title_en text NOT NULL,
    title_original text,
    snippet_en text NOT NULL,
    snippet_original text,
    images jsonb,
    news_url text UNIQUE,
    publisher text,
    created_at timestamptz DEFAULT now()
);

-- SUBNEWS
CREATE TABLE subnews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id uuid REFERENCES news(id),
    timestamp bigint NOT NULL,
    title_en text NOT NULL,
    title_original text,
    snippet_en text NOT NULL,
    snippet_original text,
    images jsonb,
    news_url text UNIQUE,
    publisher text,
    created_at timestamptz DEFAULT now()
);

-- FEATURE ENGINEERING
CREATE TABLE feature_engineering (
    id serial PRIMARY KEY,
    news_id uuid REFERENCES news(id),
    subnews_id uuid REFERENCES subnews(id),
    topic text,
    sentiment_score integer,
    sentiment_justification text
);

-- FEATURE ENTITIES
CREATE TABLE feature_entities (
    id serial PRIMARY KEY,
    feature_id integer REFERENCES feature_engineering(id),
    entity_name text,
    entity_type text,
    aliases jsonb
);

-- FEATURE KEY EVENTS
CREATE TABLE feature_key_events (
    id serial PRIMARY KEY,
    feature_id integer REFERENCES feature_engineering(id),
    event text,
    participants jsonb,
    location text,
    event_date text,
    description text,
    event_sentiment_score integer,
    event_sentiment_justification text,
    topics jsonb,
    narrative text
);

-- FEATURE RELATIONSHIPS
CREATE TABLE feature_relationships (
    id serial PRIMARY KEY,
    feature_id integer REFERENCES feature_engineering(id),
    subject text,
    relation text,
    object text
);

-- META TOPIC GROUPS
CREATE TABLE meta_topic_groups (
    id serial PRIMARY KEY,
    label text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

-- META TOPIC GROUP MEMBERS
CREATE TABLE meta_topic_group_members (
    id serial PRIMARY KEY,
    group_id integer REFERENCES meta_topic_groups(id),
    feature_id integer REFERENCES feature_engineering(id),
    topic text,
    news_id uuid REFERENCES news(id),
    subnews_id uuid REFERENCES subnews(id),
    justification text,
    created_at timestamptz DEFAULT now(),
    UNIQUE (group_id, feature_id)
);

-- SUB TOPIC GROUPS
CREATE TABLE sub_topic_groups (
    id serial PRIMARY KEY,
    meta_group_id integer REFERENCES meta_topic_groups(id),
    label text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    UNIQUE (meta_group_id, label)
);

-- SUB TOPIC GROUP MEMBERS
CREATE TABLE sub_topic_group_members (
    id serial PRIMARY KEY,
    sub_group_id integer REFERENCES sub_topic_groups(id),
    feature_id integer REFERENCES feature_engineering(id),
    topic text NOT NULL,
    news_id uuid REFERENCES news(id),
    subnews_id uuid REFERENCES subnews(id),
    justification text,
    created_at timestamptz DEFAULT now(),
    UNIQUE (sub_group_id, feature_id)
);

-- FREQUENT ENTITIES (for analytics, not always needed as a table)
CREATE TABLE frequent_entities (
    entity_name text,
    entity_type text,
    article_count bigint,
    news_count bigint,
    subnews_count bigint,
    news_urls text[],
    subnews_urls text[],
    publishers text[],
    publisher_mentions json,
    countries text[],
    avg_sentiment_rolling_1h json,
    unique_country_count bigint,
    unique_publisher_count bigint
);

-- FREQUENT ENTITIES MATERIALIZED VIEW
CREATE MATERIALIZED VIEW frequent_entities_materialized AS
SELECT
    entity_name,
    entity_type,
    COUNT(*) AS article_count,
    COUNT(DISTINCT news_id) AS news_count,
    COUNT(DISTINCT subnews_id) AS subnews_count,
    array_agg(DISTINCT news_id) AS news_urls,
    array_agg(DISTINCT subnews_id) AS subnews_urls,
    array_agg(DISTINCT publisher) AS publishers,
    -- Add more aggregations as needed
    now() AS last_updated
FROM feature_entities
LEFT JOIN feature_engineering ON feature_entities.feature_id = feature_engineering.id
LEFT JOIN news ON feature_engineering.news_id = news.id
GROUP BY entity_name, entity_type;

-- META TOPIC GROUPS VIEW
CREATE VIEW meta_topic_groups_view AS
SELECT
    m.id AS group_id,
    m.label AS group_label,
    m.description AS group_description,
    mm.feature_id,
    mm.topic,
    mm.justification,
    mm.news_id,
    mm.subnews_id,
    mm.created_at AS assigned_at
FROM meta_topic_groups m
JOIN meta_topic_group_members mm ON m.id = mm.group_id;

-- SUB TOPIC GROUPS VIEW
CREATE VIEW sub_topic_groups_view AS
SELECT
    s.id AS sub_group_id,
    s.label AS sub_group_label,
    s.description AS sub_group_description,
    s.meta_group_id,
    m.label AS meta_group_label,
    m.description AS meta_group_description,
    sm.feature_id,
    sm.topic,
    sm.justification,
    sm.news_id,
    sm.subnews_id,
    sm.created_at AS assigned_at
FROM sub_topic_groups s
JOIN meta_topic_groups m ON s.meta_group_id = m.id
JOIN sub_topic_group_members sm ON s.id = sm.sub_group_id;

-- TOPIC HIERARCHY VIEW
CREATE VIEW topic_hierarchy_view AS
SELECT
    m.id AS meta_group_id,
    m.label AS meta_group_label,
    m.description AS meta_group_description,
    s.id AS sub_group_id,
    s.label AS sub_group_label,
    s.description AS sub_group_description,
    f.id AS feature_id,
    f.topic,
    f.sentiment_score,
    f.sentiment_justification,
    sm.news_id,
    sm.subnews_id,
    sm.justification,
    sm.created_at AS assigned_at
FROM meta_topic_groups m
JOIN sub_topic_groups s ON s.meta_group_id = m.id
JOIN sub_topic_group_members sm ON s.id = sm.sub_group_id
JOIN feature_engineering f ON sm.feature_id = f.id;

-- v_meta_topic_groupings (example, adjust as needed)
CREATE VIEW v_meta_topic_groupings AS
SELECT
    mm.id AS group_member_id,
    m.id AS group_id,
    m.label AS group_label,
    m.description AS group_description,
    m.created_at AS group_created_at,
    mm.feature_id,
    f.topic AS original_topic,
    f.sentiment_score,
    f.sentiment_justification,
    mm.justification AS group_assignment_justification,
    mm.news_id,
    n.title_en AS news_title,
    n.news_url,
    mm.subnews_id,
    sn.title_en AS subnews_title,
    sn.news_url AS subnews_url,
    mm.created_at AS assignment_created_at
FROM meta_topic_groups m
JOIN meta_topic_group_members mm ON m.id = mm.group_id
JOIN feature_engineering f ON mm.feature_id = f.id
LEFT JOIN news n ON mm.news_id = n.id
LEFT JOIN subnews sn ON mm.subnews_id = sn.id;

-- Add any additional functions, triggers, or materialized views as needed.
```

---

## Setup & Installation

1. **Clone the repository**  
   `git clone <your-repo-url>`

2. **Install dependencies**  
   `pip install -r requirements.txt`

3. **Set up environment variables**  
   Create a `.env` file in the root directory:
   ```
   RAPIDAPI_KEY=your_rapidapi_key
   RAPIDAPI_HOST=google-news13.p.rapidapi.com
   DEEPSEEK_API_KEY=your_deepseek_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   ```

4. **Set up the database**  
   - Run the provided SQL scripts (`setup_subtopic_tables.sql`, etc.) in your Supabase SQL editor to create all necessary tables.

---

## Running the System

To start the full orchestrator (all components in parallel):

```bash
python start_orchestrator.py
```

- All logs are written to `orchestrator.log`.
- The system will run indefinitely until stopped (Ctrl+C).

---

## Component Details

- **News Aggregator** (`news_aggregator_module.py`):  
  Fetches news, translates if needed, and stores in the `news` and `subnews` tables.

- **Feature Engineering** (`feature_engineering.py`):  
  Extracts topics, entities, events, and sentiment using DeepSeek AI, and stores in normalized tables.

- **Topic Aggregator** (`topic_aggregator.py`):  
  Groups topics into meta-topic groups for high-level organization.

- **Sub-Topic Aggregator** (`subtopic_aggregator.py`):  
  Further sub-categorizes topics within each meta-topic group.

- **Status Monitor**:  
  Periodically logs counts of news, features, topic groups, and sub-topic groups.

---

## Monitoring & Logs

- **Main log**: `orchestrator.log`
- **Sub-topic log**: `subtopic_orchestrator.log`
- **Failed API calls**: `failed_articles.log`

---


## Troubleshooting

- **Missing environment variables**:  
  Ensure your `.env` file is present and complete.

- **Database errors**:  
  Make sure all SQL setup scripts have been run in Supabase.

- **API errors**:  
  Check your DeepSeek and RapidAPI keys and quotas.

- **Logs**:  
  Check `orchestrator.log` and `subtopic_orchestrator.log` for detailed error messages.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details. 