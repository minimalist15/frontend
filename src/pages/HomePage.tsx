import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { TrendingUp, Activity, ArrowRight, Zap, Database, Globe, Hash } from 'lucide-react';

const HomePage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current && cardsRef.current) {
      const tl = gsap.timeline();
      
      tl.fromTo(heroRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      )
      .fromTo(cardsRef.current.children,
        { y: 30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.2, ease: "power2.out" },
        "-=0.5"
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div ref={heroRef} className="text-center mb-16">
        <h1 className="text-6xl md:text-8xl font-bold mb-6">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            NewsFlow
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Discover the latest news and explore entity relationships through interactive network visualizations
        </p>
        <div className="flex items-center justify-center space-x-2 text-cyan-400 mb-12">
          <Zap size={20} />
          <span className="text-lg font-medium">Real-time insights • Interactive networks • Global coverage</span>
        </div>
      </div>

      <div ref={cardsRef} className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* Latest News Card */}
        <Link to="/news" className="group">
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-400/20 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl">
                  <TrendingUp size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">
                  Latest News
                </h2>
              </div>
              
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Stay informed with the latest developments in technology, science, and innovation from around the world.
              </p>
              
              <div className="flex items-center space-x-2 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">
                <Globe size={16} />
                <span className="font-medium">Global coverage</span>
              </div>
              
              <div className="flex items-center justify-between mt-8">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>Real-time updates</span>
                  <span>•</span>
                  <span>Multiple sources</span>
                </div>
                <ArrowRight size={20} className="text-cyan-400 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </Link>

        {/* Entity Network Card */}
        <Link to="/network" className="group">
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-purple-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-400/20 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl">
                  <Activity size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors duration-300">
                  Entity Network
                </h2>
              </div>
              
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Explore interactive network visualizations showing relationships between people, organizations, and locations.
              </p>
              
              <div className="flex items-center space-x-2 text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
                <Database size={16} />
                <span className="font-medium">Interactive visualization</span>
              </div>
              
              <div className="flex items-center justify-between mt-8">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>Dynamic filtering</span>
                  <span>•</span>
                  <span>Real connections</span>
                </div>
                <ArrowRight size={20} className="text-purple-400 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </Link>

        {/* Topics Card */}
        <Link to="/topics" className="group">
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 hover:border-orange-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-400/20 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl">
                  <Hash size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors duration-300">
                  Topics
                </h2>
              </div>
              
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Explore the hierarchical structure of topics and discover trending themes across global news coverage.
              </p>
              
              <div className="flex items-center space-x-2 text-orange-400 group-hover:text-orange-300 transition-colors duration-300">
                <Hash size={16} />
                <span className="font-medium">Topic hierarchy</span>
              </div>
              
              <div className="flex items-center justify-between mt-8">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>Hierarchical view</span>
                  <span>•</span>
                  <span>Trending themes</span>
                </div>
                <ArrowRight size={20} className="text-orange-400 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Features Section */}
      <div className="mt-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-12 bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="flex flex-col items-center space-y-4 p-6 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-cyan-400/30 transition-all duration-300">
            <div className="p-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl">
              <Zap size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Real-time Data</h3>
            <p className="text-gray-400 text-center leading-relaxed">
              Live updates from multiple news sources worldwide with instant processing and analysis
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-4 p-6 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-purple-400/30 transition-all duration-300">
            <div className="p-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl">
              <Activity size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Interactive Networks</h3>
            <p className="text-gray-400 text-center leading-relaxed">
              Explore entity relationships through dynamic visualizations with real-time filtering capabilities
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-4 p-6 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-green-400/30 transition-all duration-300">
            <div className="p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl">
              <Database size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Smart Analysis</h3>
            <p className="text-gray-400 text-center leading-relaxed">
              AI-powered entity extraction and relationship mapping for deeper insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;