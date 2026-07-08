import { useState, useEffect } from 'react';
import { ThumbsUp, Heart, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { newsApi, Reaction } from '../../lib/newsApi';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface ReactionButtonsProps {
  newsId: string;
  className?: string;
}

type ReactionType = 'like' | 'love' | 'insightful' | 'bullish' | 'bearish';

interface ReactionConfig {
  type: ReactionType;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  color: string;
  hoverColor: string;
  activeColor: string;
}

const reactions: ReactionConfig[] = [
  {
    type: 'like',
    icon: ThumbsUp,
    label: 'Like',
    color: 'text-slate-600 dark:text-slate-400',
    hoverColor: 'hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    activeColor: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
  },
  {
    type: 'love',
    icon: Heart,
    label: 'Love',
    color: 'text-slate-600 dark:text-slate-400',
    hoverColor: 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
    activeColor: 'text-red-500 bg-red-50 dark:bg-red-900/30',
  },
  {
    type: 'insightful',
    icon: Lightbulb,
    label: 'Insightful',
    color: 'text-slate-600 dark:text-slate-400',
    hoverColor: 'hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
    activeColor: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30',
  },
  {
    type: 'bullish',
    icon: TrendingUp,
    label: 'Bullish',
    color: 'text-slate-600 dark:text-slate-400',
    hoverColor: 'hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20',
    activeColor: 'text-green-500 bg-green-50 dark:bg-green-900/30',
  },
  {
    type: 'bearish',
    icon: TrendingDown,
    label: 'Bearish',
    color: 'text-slate-600 dark:text-slate-400',
    hoverColor: 'hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20',
    activeColor: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
  },
];

export function ReactionButtons({ newsId, className }: ReactionButtonsProps) {
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  // Check if this is a cached news article (simple numeric ID vs UUID)
  const isCachedNews = /^\d+$/.test(newsId);

  useEffect(() => {
    if (!isCachedNews) {
      fetchReactions();
      if (user) {
        fetchUserReaction();
      }
    }
  }, [newsId, user, isCachedNews]);

  const fetchReactions = async () => {
    try {
      const response = await newsApi.getReactions(newsId);
      setReactionCounts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
    }
  };

  const fetchUserReaction = async () => {
    try {
      const response = await newsApi.getUserReaction(newsId);
      setUserReaction(response.data.data?.type || null);
    } catch (error) {
      console.error('Failed to fetch user reaction:', error);
    }
  };

  const handleReaction = async (type: ReactionType) => {
    if (!user) {
      toast.error('Please login to react');
      return;
    }

    if (isCachedNews) {
      toast.error('Reactions are not available for this article yet');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      const response = await newsApi.toggleReaction(newsId, type);
      
      if (response.data.data.added) {
        setUserReaction(type);
        setReactionCounts((prev) => ({
          ...prev,
          [type]: (prev[type] || 0) + 1,
        }));
        toast.success(`Reacted with ${type}`);
      } else {
        setUserReaction(null);
        setReactionCounts((prev) => ({
          ...prev,
          [type]: Math.max((prev[type] || 0) - 1, 0),
        }));
      }
    } catch (error: any) {
      console.error('Failed to toggle reaction:', error);
      toast.error(error.response?.data?.message || 'Failed to react');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={clsx('flex items-center gap-2 flex-wrap', className)}>
      {reactions.map((reaction) => {
        const Icon = reaction.icon;
        const count = reactionCounts[reaction.type] || 0;
        const isActive = userReaction === reaction.type;

        return (
          <button
            key={reaction.type}
            onClick={() => handleReaction(reaction.type)}
            disabled={loading || isCachedNews}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              'border border-slate-200 dark:border-slate-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isActive ? reaction.activeColor : `${reaction.color} ${reaction.hoverColor}`,
              isActive && 'ring-2 ring-offset-1 ring-current ring-opacity-30',
              !loading && !isCachedNews && 'hover:scale-105 active:scale-95'
            )}
            title={reaction.label}
          >
            <Icon size={16} className={isActive ? 'animate-pulse' : ''} />
            {count > 0 && (
              <span className="font-semibold tabular-nums">
                {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
