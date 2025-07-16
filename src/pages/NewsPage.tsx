import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import NewsFeed from '../components/NewsFeed';

const NewsPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );
    }
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <NewsFeed />
      </div>
    </div>
  );
};

export default NewsPage;