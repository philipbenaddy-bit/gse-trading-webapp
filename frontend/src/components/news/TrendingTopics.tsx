import { useState, useEffect } from 'react';
import { TrendingUp, Hash, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { newsApi } from '../../lib/newsApi';

interface Topic {
  name: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  searchTerm: string;
}

interface TrendingTopicsProps {
  onTopicClick?: (searchTerm: string) => void;
}

export function TrendingTopics({ onTopicClick }: TrendingTopicsProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingTopics();
  }, []);

  const fetchTrendingTopics = async () => {
    try {
      setLoading(true);
      // Fetch recent news to extract trending topics
      const response = await newsApi.getAllNews({ limit: 100 });
      const news = response.data.data;

      // Extract and count categories
      const categoryCount: Record<string, number> = {};
      news.forEach((article) => {
        if (article.category) {
          const category = article.category.toLowerCase();
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
      });

      // Convert to topics array and sort by count
      const extractedTopics: Topic[] = Object.entries(categoryCount)
        .map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count,
          trend: count > 15 ? 'up' : count > 8 ? 'stable' : 'down' as 'up' | 'down' | 'stable',
          searchTerm: name,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setTopics(extractedTopics);
    } catch (error) {
      console.error('Failed to fetch trending topics:', error);
      // Fallback to static topics
      setTopics([
        { name: 'Banking Sector', count: 45, trend: 'up', searchTerm: 'bank' },
        { name: 'Market Analysis', count: 38, trend: 'up', searchTerm: 'market' },
        { name: 'Company News', count: 32, trend: 'stable', searchTerm: 'company' },
        { name: 'Economy', count: 28, trend: 'down', searchTerm: 'economy' },
        { name: 'Regulation', count: 24, trend: 'up', searchTerm: 'regulation' },
        { name: 'Analysis', count: 18, trend: 'stable', searchTerm: 'analysis' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleTopicClick = (topic: Topic) => {
    if (onTopicClick) {
      onTopicClick(topic.searchTerm);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-2 border-gray-100 dark:border-gray-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
            <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span>Trending Topics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-2 border-gray-100 dark:border-gray-800">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
          <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span>Trending Topics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {topics.map((topic, index) => (
          <button
            key={topic.name}
            onClick={() => handleTopicClick(topic)}
            className="w-full group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
          >
            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <Hash className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {topic.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {topic.count} articles
                    </span>
                    <span className={`text-xs font-medium ${getTrendColor(topic.trend)}`}>
                      {topic.trend === 'up' && '↗ Trending'}
                      {topic.trend === 'down' && '↘ Cooling'}
                      {topic.trend === 'stable' && '→ Steady'}
                    </span>
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>

            {/* Rank badge */}
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
              {index + 1}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
