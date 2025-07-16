import { supabase } from '../lib/supabase';

export interface EntityStats {
  totalMentions: number;
  uniqueArticles: number;
  avgSentiment: number;
}

/**
 * Service for fetching entity statistics
 */
export class EntityStatsService {
  /**
   * Get basic statistics for an entity
   */
  static async getEntityStats(entityName: string): Promise<EntityStats> {
    console.log(`📊 STATS: Fetching stats for "${entityName}"`);
    
    try {
      // Get all feature_ids for this entity
      const { data: entityFeatures, error: entityError } = await supabase
        .from('feature_entities')
        .select('feature_id')
        .eq('entity_name', entityName);

      if (entityError || !entityFeatures) {
        console.error('Error fetching entity features:', entityError);
        return { totalMentions: 0, uniqueArticles: 0, avgSentiment: 0 };
      }

      const featureIds = entityFeatures.map(f => f.feature_id);
      const totalMentions = featureIds.length;

      if (featureIds.length === 0) {
        return { totalMentions: 0, uniqueArticles: 0, avgSentiment: 0 };
      }

      // Get feature engineering data for sentiment and article counts
      const { data: featureData, error: featureError } = await supabase
        .from('feature_engineering')
        .select('sentiment_score, news_id, subnews_id')
        .in('id', featureIds);

      if (featureError || !featureData) {
        console.error('Error fetching feature data:', featureError);
        return { totalMentions, uniqueArticles: 0, avgSentiment: 0 };
      }

      // Count unique articles (news_id + subnews_id)
      const uniqueArticleIds = new Set<string>();
      const sentimentScores: number[] = [];

      featureData.forEach(feature => {
        if (feature.news_id) {
          uniqueArticleIds.add(`news_${feature.news_id}`);
        }
        if (feature.subnews_id) {
          uniqueArticleIds.add(`subnews_${feature.subnews_id}`);
        }
        if (feature.sentiment_score !== null && feature.sentiment_score !== undefined) {
          sentimentScores.push(feature.sentiment_score);
        }
      });

      const uniqueArticles = uniqueArticleIds.size;
      const avgSentiment = sentimentScores.length > 0 
        ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length 
        : 0;

      console.log(`📊 STATS RESULT for "${entityName}":`, {
        totalMentions,
        uniqueArticles,
        avgSentiment: avgSentiment.toFixed(2)
      });

      return {
        totalMentions,
        uniqueArticles,
        avgSentiment
      };

    } catch (error) {
      console.error('Error in getEntityStats:', error);
      return { totalMentions: 0, uniqueArticles: 0, avgSentiment: 0 };
    }
  }
}