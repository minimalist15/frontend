import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NewsCard from './NewsCard';
import { fetchFilteredNews, NewsArticle } from '../lib/newsApi';
import { debugDatabase } from '../lib/debugApi';
import { TrendingUp, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const NewsFeed: React.FC = () => {
  const feedRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
    // Debug database connectivity and data
    debugDatabase();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const articles = await fetchFilteredNews({}, 50);
      setArticles(articles);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", delay: 0.5 }
      );
    }
  }, []);

  return (
    <div ref={feedRef} className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6">
        <div ref={titleRef} className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg">
              <TrendingUp size={24} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Latest News</h2>
            <div className="flex items-center space-x-1 text-cyan-400">
              <Zap size={16} />
              <span className="text-sm font-medium">
                {loading ? 'Loading...' : `${articles.length} articles`}
              </span>
            </div>
          </div>
          <p className="text-gray-400 text-lg">
            Stay informed with the latest developments in technology, science, and innovation.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white text-lg">Loading news articles...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400 text-lg">
              No news articles available
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map((article, index) => (
              <NewsCard key={article.id} article={article} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;