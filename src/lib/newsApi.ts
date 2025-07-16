import { supabase } from './supabase';
import { FilterOptions, NewsFilters, EntityOption, TopicOption } from '../types/filters';

export interface NewsArticle {
  id: string;
  title_en: string;
  snippet_en: string;
  news_url: string;
  publisher: string;
  country: string;
  timestamp: number;
  created_at: string;
  language: string;
  images?: any;
}

// Fetch all available filter options
export const fetchFilterOptions = async (): Promise<FilterOptions> => {
  try {
    console.log('Fetching filter options...');
    
    // Fetch countries
    const { data: countriesData, error: countriesError } = await supabase
      .from('news')
      .select('country')
      .not('country', 'is', null);

    if (countriesError) {
      console.error('Error fetching countries:', countriesError);
    }

    const countries = [...new Set(countriesData?.map(c => c.country) || [])].sort();
    console.log(`Found ${countries.length} countries:`, countries.slice(0, 5));

    // Fetch entities
    const { data: entitiesData, error: entitiesError } = await supabase
      .from('frequent_entities_materialized')
      .select('entity_name, entity_type, news_count')
      .order('news_count', { ascending: false })
      .limit(100);

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError);
    }

    const entities: EntityOption[] = (entitiesData || []).map(entity => ({
      name: entity.entity_name,
      type: entity.entity_type,
      count: entity.news_count
    }));
    console.log(`Found ${entities.length} entities:`, entities.slice(0, 3));

    // Fetch topics from topic hierarchy
    const { data: topicsData, error: topicsError } = await supabase
      .from('topic_hierarchy_view')
      .select('meta_group_label, sub_group_label, topic')
      .not('topic', 'is', null);

    if (topicsError) {
      console.error('Error fetching topics from topic_hierarchy_view:', topicsError);
      console.log('Trying fallback to feature_engineering for topics...');
      
      // Fallback: try to get topics directly from feature_engineering
      const { data: fallbackTopicsData, error: fallbackError } = await supabase
        .from('feature_engineering')
        .select('topic')
        .not('topic', 'is', null);

      if (fallbackError) {
        console.error('Error fetching topics from feature_engineering:', fallbackError);
      } else {
        console.log(`Found ${fallbackTopicsData?.length || 0} topics in feature_engineering`);
      }
    }

    // Group topics by meta group and sub group
    const topicMap = new Map<string, Map<string, Set<string>>>();
    (topicsData || []).forEach(item => {
      const metaGroup = item.meta_group_label || 'Uncategorized';
      const subGroup = item.sub_group_label || 'Uncategorized';
      const topic = item.topic;

      if (!topicMap.has(metaGroup)) {
        topicMap.set(metaGroup, new Map());
      }
      if (!topicMap.get(metaGroup)!.has(subGroup)) {
        topicMap.get(metaGroup)!.set(subGroup, new Set());
      }
      topicMap.get(metaGroup)!.get(subGroup)!.add(topic);
    });

    const topics: TopicOption[] = [];
    topicMap.forEach((subGroups, metaGroup) => {
      subGroups.forEach((topicSet, subGroup) => {
        topicSet.forEach(topic => {
          topics.push({
            metaGroup,
            subGroup,
            topic,
            count: 0 // We'll calculate this when needed
          });
        });
      });
    });
    console.log(`Found ${topics.length} topics organized in ${topicMap.size} meta groups`);

    return {
      countries,
      entities,
      topics,
      dateRange: { start: null, end: null }
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      countries: [],
      entities: [],
      topics: [],
      dateRange: { start: null, end: null }
    };
  }
};

// Fetch filtered news articles
export const fetchFilteredNews = async (filters: NewsFilters, limit: number = 50): Promise<NewsArticle[]> => {
  try {
    let query = supabase
      .from('news')
      .select('id, title_en, snippet_en, news_url, publisher, country, timestamp, created_at, language, images')
      .order('timestamp', { ascending: false });

    // Apply country filter
    if (filters.countries && filters.countries.length > 0) {
      query = query.in('country', filters.countries);
    }

    // Apply date range filter
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Apply entity filter
    if (filters.entityNames && filters.entityNames.length > 0) {
      // Get feature IDs for the selected entities
      const { data: entityFeatures, error: entityError } = await supabase
        .from('feature_entities')
        .select('feature_id')
        .in('entity_name', filters.entityNames);

      if (entityError) {
        console.error('Error fetching entity features:', entityError);
        return [];
      }

      if (entityFeatures && entityFeatures.length > 0) {
        const featureIds = entityFeatures.map(f => f.feature_id);
        
        // Get news IDs from feature engineering
        const { data: featureData, error: featureError } = await supabase
          .from('feature_engineering')
          .select('news_id')
          .in('id', featureIds)
          .not('news_id', 'is', null);

        if (featureError) {
          console.error('Error fetching feature data for entities:', featureError);
          return [];
        }

        if (featureData && featureData.length > 0) {
          const newsIds = [...new Set(featureData.map(f => f.news_id))];
          query = query.in('id', newsIds);
        } else {
          // No news found for these entities, return empty array
          console.log('No news found for selected entities:', filters.entityNames);
          return [];
        }
      } else {
        // No entities found, return empty array
        console.log('No entities found in database for:', filters.entityNames);
        return [];
      }
    }

    // Apply topic filter
    if (filters.topics && filters.topics.length > 0) {
      console.log('Applying topic filter for:', filters.topics);
      
      // First try to get feature IDs from topic_hierarchy_view
      const { data: topicFeatures, error: topicError } = await supabase
        .from('topic_hierarchy_view')
        .select('feature_id')
        .in('topic', filters.topics);

      if (topicError) {
        console.error('Error fetching topic features from topic_hierarchy_view:', topicError);
        // Fallback: try to get from feature_engineering directly
        const { data: directTopicFeatures, error: directError } = await supabase
          .from('feature_engineering')
          .select('id, news_id')
          .in('topic', filters.topics)
          .not('news_id', 'is', null);

        if (directError) {
          console.error('Error fetching topic features from feature_engineering:', directError);
          return [];
        }

        if (directTopicFeatures && directTopicFeatures.length > 0) {
          const newsIds = [...new Set(directTopicFeatures.map(f => f.news_id))];
          query = query.in('id', newsIds);
        } else {
          console.log('No news found for selected topics:', filters.topics);
          return [];
        }
      } else if (topicFeatures && topicFeatures.length > 0) {
        const featureIds = topicFeatures.map(f => f.feature_id);
        
        // Get news IDs from feature engineering
        const { data: featureData, error: featureError } = await supabase
          .from('feature_engineering')
          .select('news_id')
          .in('id', featureIds)
          .not('news_id', 'is', null);

        if (featureError) {
          console.error('Error fetching feature data for topics:', featureError);
          return [];
        }

        if (featureData && featureData.length > 0) {
          const newsIds = [...new Set(featureData.map(f => f.news_id))];
          query = query.in('id', newsIds);
        } else {
          console.log('No news found for selected topics:', filters.topics);
          return [];
        }
      } else {
        console.log('No topic features found in topic_hierarchy_view for:', filters.topics);
        return [];
      }
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching filtered news:', error);
      return [];
    }

    console.log(`Fetched ${data?.length || 0} articles with filters:`, filters);
    return data || [];
  } catch (error) {
    console.error('Error fetching filtered news:', error);
    return [];
  }
};

// Get entity types for filtering
export const fetchEntityTypes = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('frequent_entities_materialized')
      .select('entity_type')
      .not('entity_type', 'is', null);

    if (error) {
      console.error('Error fetching entity types:', error);
      return [];
    }

    return [...new Set(data?.map(e => e.entity_type) || [])].sort();
  } catch (error) {
    console.error('Error fetching entity types:', error);
    return [];
  }
}; 

// Fetch available filter options based on a set of news IDs
export const fetchAvailableFilterOptions = async (newsIds: string[]): Promise<FilterOptions> => {
  // Countries
  const { data: countryData } = await supabase
    .from('news')
    .select('country')
    .in('id', newsIds);
  const countries = [...new Set((countryData || []).map(c => c.country))].sort();

  // Entities (from feature_engineering -> feature_entities)
  const { data: featureIdsData } = await supabase
    .from('feature_engineering')
    .select('id')
    .in('news_id', newsIds);
  const featureIds = (featureIdsData || []).map(f => f.id);

  let entities: EntityOption[] = [];
  if (featureIds.length > 0) {
    const { data: entityData } = await supabase
      .from('feature_entities')
      .select('entity_name, entity_type')
      .in('feature_id', featureIds);
    const entityMap = new Map<string, { name: string; type: string; count: number }>();
    (entityData || []).forEach(e => {
      const key = `${e.entity_name}|${e.entity_type}`;
      if (!entityMap.has(key)) {
        entityMap.set(key, { name: e.entity_name, type: e.entity_type, count: 1 });
      } else {
        entityMap.get(key)!.count++;
      }
    });
    entities = Array.from(entityMap.values()).sort((a, b) => b.count - a.count);
  }

  // Topics (from topic_hierarchy_view)
  let topics: TopicOption[] = [];
  if (featureIds.length > 0) {
    const { data: topicData } = await supabase
      .from('topic_hierarchy_view')
      .select('meta_group_label, sub_group_label, topic')
      .in('feature_id', featureIds);
    const topicMap = new Map<string, TopicOption>();
    (topicData || []).forEach(t => {
      const key = `${t.meta_group_label}|${t.sub_group_label}|${t.topic}`;
      if (!topicMap.has(key)) {
        topicMap.set(key, {
          metaGroup: t.meta_group_label,
          subGroup: t.sub_group_label,
          topic: t.topic,
          count: 1
        });
      } else {
        topicMap.get(key)!.count++;
      }
    });
    topics = Array.from(topicMap.values()).sort((a, b) => b.count - a.count);
  }

  return {
    countries,
    entities,
    topics,
    dateRange: { start: null, end: null }
  };
}; 