import { supabase } from '../lib/supabase';

export interface TopicHierarchyData {
  id: string;
  value: number;
  depth: number;
  index: number;
  label: string;
  description?: string;
  type: 'meta' | 'sub';
  metaGroupId?: number;
  subGroupId?: number;
  topicCount: number;
  featureCount: number;
}

export interface TopicHierarchyStats {
  totalMetaGroups: number;
  totalSubGroups: number;
  totalTopics: number;
  totalFeatures: number;
}

/**
 * Service for fetching and processing topic hierarchy data
 */
export class TopicHierarchyService {
  /**
   * Get topic hierarchy statistics
   */
  static async getHierarchyStats(): Promise<TopicHierarchyStats> {
    try {
      // Fetch all rows from sub_topic_groups_view using batching
      const batchSize = 1000;
      let offset = 0;
      let allData: any[] = [];
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('sub_topic_groups_view')
          .select('meta_group_label, sub_group_label, topic')
          .range(offset, offset + batchSize - 1);
        if (error) {
          console.error('Error fetching hierarchy stats data:', error);
          throw error;
        }
        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          allData = allData.concat(data);
          offset += batchSize;
          if (data.length < batchSize) {
            hasMore = false;
          }
        }
      }
      // Count unique macro topics, sub topics, and topics
      const macroTopics = new Set<string>();
      const subTopics = new Set<string>();
      const topics = new Set<string>();
      for (const row of allData) {
        if (row.meta_group_label) macroTopics.add(row.meta_group_label);
        if (row.sub_group_label) subTopics.add(row.sub_group_label);
        if (row.topic) topics.add(row.topic);
      }
      return {
        totalMetaGroups: macroTopics.size,
        totalSubGroups: subTopics.size,
        totalTopics: topics.size,
        totalFeatures: 0 // Not used anymore
      };
    } catch (error) {
      console.error('Error in getHierarchyStats:', error);
      throw error;
    }
  }

  /**
   * Get the complete topic hierarchy data
   */
  static async getTopicHierarchyData(): Promise<any[]> {
    console.log('=== TOPIC HIERARCHY DATA CREATION ===');
    try {
      const batchSize = 1000;
      let offset = 0;
      let allData: any[] = [];
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('sub_topic_groups_view')
          .select('meta_group_label, sub_group_label, topic, news_id, subnews_id')
          .range(offset, offset + batchSize - 1);
        if (error) {
          console.error('Error fetching hierarchy data:', error);
          throw error;
        }
        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          allData = allData.concat(data);
          offset += batchSize;
          if (data.length < batchSize) {
            hasMore = false;
          }
        }
      }
      console.log(`📊 Found ${allData.length} hierarchy records`);
      return allData;
    } catch (error) {
      console.error('Error in getTopicHierarchyData:', error);
      throw error;
    }
  }

  /**
   * Build a nested hierarchy object for ECharts treemap from flat data.
   */
  static buildNestedHierarchy(data: any[]): any {
    const root: any = {};
    for (const row of data) {
      const { meta_group_label, sub_group_label, topic, news_url } = row;
      if (!root[meta_group_label]) {
        root[meta_group_label] = {};
      }
      if (!root[meta_group_label][sub_group_label]) {
        root[meta_group_label][sub_group_label] = {};
      }
      // Attach the topic as a leaf node, with url if available
      root[meta_group_label][sub_group_label][topic] = { url: news_url || null };
    }
    return root;
  }

  /**
   * Get detailed information for a specific meta group
   */
  static async getMetaGroupDetails(metaGroupId: number) {
    try {
      const { data, error } = await supabase
        .from('topic_hierarchy_view')
        .select('*')
        .eq('meta_group_id', metaGroupId);

      if (error) {
        console.error('Error fetching meta group details:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getMetaGroupDetails:', error);
      throw error;
    }
  }

  /**
   * Get detailed information for a specific sub group
   */
  static async getSubGroupDetails(subGroupId: number) {
    try {
      const { data, error } = await supabase
        .from('sub_topic_groups_view')
        .select('*')
        .eq('sub_group_id', subGroupId);

      if (error) {
        console.error('Error fetching sub group details:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getSubGroupDetails:', error);
      throw error;
    }
  }
} 