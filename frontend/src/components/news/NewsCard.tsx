import { useState } from 'react';
import { Clock, Eye, MessageCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { News } from '../../lib/newsApi';
import { ReactionButtons } from './ReactionButtons';
import { CommentSection } from './CommentSection';
import { formatDistanceToNow } from 'date-fns';

interface NewsCardProps {
  news: News;
  variant?: 'default' | 'large';
}

export const NewsCard: React.FC<NewsCardProps> = ({ news, variant = 'default' }) => {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'market':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'company':
        return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'economy':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'analysis':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'regulation':
        return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const isLarge = variant === 'large';

  return (
    <article className="group h-full">
      <Card 
        variant="bordered" 
        className="h-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200 dark:hover:border-blue-800"
      >
        {/* Image Section */}
        {news.imageUrl && (
          <div className={`relative overflow-hidden ${isLarge ? 'h-64' : 'h-44'}`}>
            <img
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Category Badge on Image */}
            <div className="absolute top-3 left-3">
              {news.category && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide backdrop-blur-sm ${getCategoryColor(news.category)}`}>
                  {news.category}
                </span>
              )}
            </div>

            {/* Related Symbols on Image */}
            {news.relatedSymbols && news.relatedSymbols.length > 0 && (
              <div className="absolute top-3 right-3 flex gap-1">
                {news.relatedSymbols.slice(0, 2).map((symbol) => (
                  <span
                    key={symbol}
                    className="px-1.5 py-0.5 text-xs font-bold bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white rounded backdrop-blur-sm"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <CardContent className={`${isLarge ? 'p-5' : 'p-4'}`}>
          {/* Category Badge (if no image) */}
          {!news.imageUrl && news.category && (
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${getCategoryColor(news.category)}`}>
                {news.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h3
            className={`font-bold leading-tight text-gray-900 dark:text-gray-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer mb-2 ${
              isLarge ? 'text-xl lg:text-2xl' : 'text-base lg:text-lg'
            }`}
            onClick={() => setExpanded(!expanded)}
          >
            {news.title}
          </h3>

          {/* Summary */}
          {news.summary && !expanded && (
            <p className={`text-gray-600 dark:text-gray-400 leading-snug mb-3 ${
              isLarge ? 'text-sm line-clamp-2' : 'text-xs line-clamp-2'
            }`}>
              {news.summary}
            </p>
          )}

          {/* Expanded Content */}
          {expanded && (
            <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                {news.content}
              </div>
            </div>
          )}

          {/* Reactions Section */}
          <div className="mb-3">
            <ReactionButtons newsId={news.id} />
          </div>

          {/* Meta Information & Actions */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock size={12} className="opacity-70" />
                <span className="text-xs">{formatDistanceToNow(new Date(news.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye size={12} className="opacity-70" />
                <span className="text-xs">{news.viewCount.toLocaleString()}</span>
              </div>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <MessageCircle size={12} className="opacity-70" />
                <span className="text-xs">{news.commentCount}</span>
              </button>
            </div>

            {news.sourceUrl && (
              <a
                href={news.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs"
              >
                <span>Source</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>

          {/* Read More Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2 px-3 rounded-lg font-medium text-xs transition-all duration-200 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          >
            {expanded ? '← Show Less' : 'Read Full Article →'}
          </button>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-300">
              <CommentSection newsId={news.id} />
            </div>
          )}
        </CardContent>
      </Card>
    </article>
  );
};
