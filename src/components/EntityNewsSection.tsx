import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink, Globe, Building } from 'lucide-react';

interface EntityNewsSectionProps {
  entityName: string;
}

interface NewsArticle {
  id: string;
  title_en: string;
  snippet_en: string;
  news_url: string;
  publisher: string;
  country: string;
  timestamp: number;
  created_at: string;
}

interface PublisherStats {
  publisher: string;
  count: number;
  countries: string[];
}

const EntityNewsSection: React.FC<EntityNewsSectionProps> = ({ entityName }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewsData();
  }, [entityName]);

  const loadNewsData = async () => {
    try {
      setLoading(true);
      
      // Get all feature_ids for this entity
      const { data: entityFeatures, error: entityError } = await supabase
        .from('feature_entities')
        .select('feature_id')
        .eq('entity_name', entityName);

      if (entityError || !entityFeatures) {
        console.error('Error fetching entity features:', entityError);
        return;
      }

      const featureIds = entityFeatures.map(f => f.feature_id);
      
      if (featureIds.length === 0) {
        setArticles([]);
        return;
      }

      // Get feature engineering data to get news_id and subnews_id
      const { data: featureData, error: featureError } = await supabase
        .from('feature_engineering')
        .select('news_id, subnews_id')
        .in('id', featureIds);

      if (featureError || !featureData) {
        console.error('Error fetching feature data:', featureError);
        return;
      }

      // Get unique news_ids and subnews_ids
      const newsIds = [...new Set(featureData.filter(f => f.news_id).map(f => f.news_id))];
      const subnewsIds = [...new Set(featureData.filter(f => f.subnews_id).map(f => f.subnews_id))];

      // Fetch news and subnews articles
      const [newsData, subnewsData] = await Promise.all([
        newsIds.length > 0 ? supabase
          .from('news')
          .select('id, title_en, snippet_en, news_url, publisher, country, timestamp, created_at')
          .in('id', newsIds)
          .order('timestamp', { ascending: false })
          .limit(10) : Promise.resolve({ data: [] }),
        subnewsIds.length > 0 ? supabase
          .from('subnews')
          .select('id, title_en, snippet_en, news_url, publisher, timestamp, created_at')
          .in('id', subnewsIds)
          .order('timestamp', { ascending: false })
          .limit(10) : Promise.resolve({ data: [] })
      ]);

      // Combine and sort articles with improved sorting logic
      const allArticles: NewsArticle[] = [
        ...(newsData.data || []).map(article => ({ ...article, country: article.country || 'Unknown' })),
        ...(subnewsData.data || []).map(article => ({ ...article, country: 'Unknown' }))
      ].sort((a, b) => {
        // Get the most reliable timestamp for each article
        const aTime = a.created_at ? new Date(a.created_at).getTime() : (a.timestamp * 1000);
        const bTime = b.created_at ? new Date(b.created_at).getTime() : (b.timestamp * 1000);
        
        // Sort in descending order (most recent first)
        return bTime - aTime;
      }).slice(0, 10);

      setArticles(allArticles);

    } catch (error) {
      console.error('Error loading news data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number, createdAt?: string) => {
    const date = createdAt ? new Date(createdAt) : new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Articles</h3>
        {articles.length === 0 ? (
          <div className="text-gray-400">No articles found for this entity.</div>
        ) : (
          <div className="space-y-4">
            {articles.map(article => (
              <div key={article.id} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="text-white font-medium text-sm mb-2 line-clamp-2">
                      {article.title_en}
                    </h5>
                    <p className="text-gray-300 text-xs mb-2 line-clamp-2">
                      {article.snippet_en}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{article.publisher}</span>
                      <span>{formatDate(article.timestamp, article.created_at)}</span>
                    </div>
                  </div>
                  {article.news_url && (
                    <a
                      href={article.news_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-300"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityNewsSection;