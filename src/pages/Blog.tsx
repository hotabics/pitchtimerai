// Blog Index Page - Editorial style blog listing with filtering

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BLOG_POSTS, CATEGORY_COLORS, BlogCategory } from '@/data/blogPosts';
import { cn } from '@/lib/utils';

type FilterCategory = BlogCategory | 'All';

const FILTER_OPTIONS: FilterCategory[] = ['All', 'Hackathon', 'Startup', 'Public Speaking', 'Technology'];

const Blog = () => {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');

  const filteredPosts = activeFilter === 'All' 
    ? BLOG_POSTS 
    : BLOG_POSTS.filter(post => post.category === activeFilter);

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="py-16 md:py-24 px-4 border-b border-border">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-4">
              <BookOpen className="w-3 h-3 mr-1" />
              Resources
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Master the Art of the Pitch
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tips, tricks, and data-driven insights to help you become a more compelling presenter.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            {FILTER_OPTIONS.map((category) => (
              <Button
                key={category}
                variant={activeFilter === category ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter(category)}
                className={cn(
                  'whitespace-nowrap',
                  activeFilter === category && 'shadow-md'
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Featured Post (Hero Article) */}
          {featuredPost && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-12"
            >
              <Link to={`/blog/${featuredPost.id}`} className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-muted aspect-[21/9]">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                    <Badge className={cn('mb-3 border', CATEGORY_COLORS[featuredPost.category])}>
                      {featuredPost.category}
                    </Badge>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-white/80 mb-4 max-w-2xl line-clamp-2">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-white/60 text-sm">
                      <div className="flex items-center gap-2">
                        <img
                          src={featuredPost.author.avatar}
                          alt={featuredPost.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span>{featuredPost.author.name}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {featuredPost.readTime}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.article>
          )}

          {/* Remaining Posts Grid */}
          {remainingPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <Link to={`/blog/${post.id}`} className="group block h-full">
                    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
                      {/* Image */}
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className={cn('border', CATEGORY_COLORS[post.category])}>
                            {post.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <img
                              src={post.author.avatar}
                              alt={post.author.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span>{post.author.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {post.readTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No articles found in this category.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setActiveFilter('All')}
              >
                View all articles
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-4 bg-muted/30 border-t border-border">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-3">Stay in the loop</h2>
          <p className="text-muted-foreground mb-6">
            Get the latest pitch tips and presentation insights delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/ai-coach">
              <Button size="lg" className="gap-2">
                Try AI Coach
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
