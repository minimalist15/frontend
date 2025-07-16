import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExternalLink, Clock, Tag } from 'lucide-react';
import { NewsArticle } from '../lib/newsApi';

gsap.registerPlugin(ScrollTrigger);

interface NewsCardProps {
  article: NewsArticle;
  index: number;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current && imageRef.current && contentRef.current) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top bottom-=100",
          end: "bottom top",
          toggleActions: "play none none reverse"
        }
      });

      tl.fromTo(cardRef.current,
        { y: 50, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }
      )
      .fromTo(contentRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" },
        "-=0.2"
      );
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return (
    <div
      ref={cardRef}
      className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden hover:border-cyan-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-400/20"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      

      <div ref={contentRef} className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-cyan-400 font-medium">{article.publisher}</span>
          <div className="flex items-center text-xs text-gray-400">
            <Clock size={12} className="mr-1" />
            {article.country}
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300 line-clamp-2">
          {article.title_en}
        </h3>

        <p className="text-gray-300 mb-4 line-clamp-3 leading-relaxed">
          {article.snippet_en}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {article.created_at ? formatDate(article.created_at) : formatTimestamp(article.timestamp)}
          </span>
          {article.news_url && (
            <a
              href={article.news_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors duration-300 group/link"
            >
              <span className="mr-1">Read more</span>
              <ExternalLink size={14} className="group-hover/link:translate-x-1 transition-transform duration-300" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsCard;