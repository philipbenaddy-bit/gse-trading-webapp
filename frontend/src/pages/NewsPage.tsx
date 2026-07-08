import { useState, useEffect, useCallback, useRef } from 'react';
import { Newspaper, ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NewsCard } from '../components/news/NewsCard';
import { TrendingTopics } from '../components/news/TrendingTopics';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FadeUp } from '../components/ui/PageTransition';
import { NewsCardSkeleton } from '../components/ui/PageSkeleton';
import { newsApi, News } from '../lib/newsApi';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES    = ['all', 'market', 'company', 'economy', 'analysis', 'regulation'];
const ITEMS_PER_PAGE = 12;

export default function NewsPage() {
  const [news,          setNews]          = useState<News[]>([]);
  const [featuredNews,  setFeaturedNews]  = useState<News[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [hasMore,       setHasMore]       = useState(true);
  const [category,      setCategory]      = useState('all');
  const [searchTerm,    setSearchTerm]    = useState('');
  const [offset,        setOffset]        = useState(0);
  const [currentSlide,  setCurrentSlide]  = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchFeaturedNews = async () => {
    try {
      const response = await newsApi.getTrendingNews(5);
      setFeaturedNews(response.data);
    } catch (error) {
      console.error('Failed to fetch featured news:', error);
    }
  };

  const fetchNews = useCallback(async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      if (reset) { setLoading(true); setNews([]); } else { setLoadingMore(true); }
      const params: any = { limit: ITEMS_PER_PAGE, offset: currentOffset };
      if (category !== 'all') params.category = category;
      const response = await newsApi.getAllNews(params);
      let newNews = response.data.data;
      if (searchTerm) {
        newNews = newNews.filter((article: News) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.summary?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (reset) { setNews(newNews); setOffset(ITEMS_PER_PAGE); }
      else { setNews((prev) => [...prev, ...newNews]); setOffset((prev) => prev + ITEMS_PER_PAGE); }
      setHasMore(newNews.length === ITEMS_PER_PAGE && !searchTerm);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load news');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, offset, searchTerm]);

  const handleTopicClick = (topic: string) => {
    setSearchTerm(topic);
    setCategory('all');
    toast.success(`Filtering news by: ${topic}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => { fetchFeaturedNews(); fetchNews(true); }, [category, searchTerm]);

  useEffect(() => {
    if (featuredNews.length === 0) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % featuredNews.length), 5000);
    return () => clearInterval(timer);
  }, [featuredNews.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) fetchNews(false); },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [hasMore, loadingMore, loading, fetchNews]);

  return (
    <div className="min-h-screen relative bg-background">

      {/* Hero Header */}
      <FadeUp>
        <div className="relative overflow-hidden african-card mx-3 md:mx-4 mt-4">
          {/* Kente stripe */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-ghana" />
          <div className="relative container py-6 md:py-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2.5 md:p-3 bg-[#D4AF37]/10 rounded-xl">
                <Newspaper className="h-6 w-6 md:h-8 md:w-8 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">Market News</h1>
                <p className="text-muted-foreground text-sm mt-1">Stay ahead with real-time Ghana finance insights</p>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      <div className="container py-6 md:py-8 px-3 md:px-auto">

        {/* Featured Carousel */}
        {featuredNews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8 md:mb-10 relative group"
          >
            <div className="relative h-[280px] md:h-[460px] african-card overflow-hidden">
              <AnimatePresence mode="wait">
                {featuredNews.map((item, index) => (
                  index === currentSlide && (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                    >
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10">
                        <div className="max-w-4xl">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 md:mb-4 text-[#1a1200]"
                            style={{ background: 'linear-gradient(135deg, #F4D03F, #D4AF37)' }}
                          >
                            {item.category?.toUpperCase() || 'FEATURED'}
                          </span>
                          <h2 className="text-lg md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 leading-tight text-white line-clamp-2">
                            {item.title}
                          </h2>
                          <p className="text-gray-200 text-sm mb-3 line-clamp-1 hidden md:block">{item.summary}</p>
                          <div className="flex items-center gap-3 md:gap-5 text-xs md:text-sm text-gray-300 flex-wrap">
                            <span className="font-medium text-[#D4AF37]">{item.source}</span>
                            <span>·</span>
                            <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                            <span className="hidden sm:flex items-center gap-1">
                              · <Eye size={12} className="ml-1" />{item.viewCount.toLocaleString()} views
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>
            </div>

            {/* Carousel controls */}
            <button
              onClick={() => setCurrentSlide((p) => (p - 1 + featuredNews.length) % featuredNews.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 african-card p-2.5 md:p-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
            >
              <ChevronLeft size={20} className="text-[#D4AF37]" />
            </button>
            <button
              onClick={() => setCurrentSlide((p) => (p + 1) % featuredNews.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 african-card p-2.5 md:p-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
            >
              <ChevronRight size={20} className="text-[#D4AF37]" />
            </button>

            {/* Slide dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {featuredNews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8'
                      : 'bg-white/40 w-1.5'
                  }`}
                  style={index === currentSlide ? { background: 'linear-gradient(90deg, #D4AF37, #F4D03F)' } : {}}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="relative mb-5"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search news…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
          />
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all text-sm flex-shrink-0 ${
                category === cat
                  ? 'text-[#1a1200] shadow-gold-sm scale-105'
                  : 'border border-border hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/6 text-muted-foreground'
              }`}
              style={category === cat ? { background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' } : {}}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <ErrorBoundary inline section="News Feed">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {[...Array(6)].map((_, i) => <NewsCardSkeleton key={i} />)}
                </div>
              ) : news.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 auto-rows-fr">
                    {news.map((item, index) => {
                      const isLarge = (index + 1) % 5 === 0;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (index % 12) * 0.04, duration: 0.35 }}
                          className={isLarge ? 'sm:col-span-2' : ''}
                        >
                          <NewsCard news={item} variant={isLarge ? 'large' : 'default'} />
                        </motion.div>
                      );
                    })}
                  </div>

                  {loadingMore && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {[...Array(3)].map((_, i) => <NewsCardSkeleton key={i} />)}
                    </div>
                  )}

                  {hasMore && <div ref={observerTarget} className="h-10" />}

                  {!hasMore && (
                    <div className="text-center py-12 mt-4">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full african-card mb-3">
                        <Newspaper className="h-7 w-7 text-[#D4AF37]" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-1">You're all caught up!</h3>
                      <p className="text-muted-foreground text-sm">Check back later for more insights</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="african-card p-12 text-center">
                  <Newspaper className="h-10 w-10 text-[#D4AF37] mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-foreground mb-2">No articles found</h3>
                  <p className="text-muted-foreground text-sm">Try a different category or search term</p>
                </div>
              )}
            </ErrorBoundary>
          </div>

          {/* Sidebar */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-8 lg:self-start">
            <ErrorBoundary inline section="Trending Topics">
              <TrendingTopics onTopicClick={handleTopicClick} />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
