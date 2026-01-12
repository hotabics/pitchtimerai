// Blog Article Reader Page - Editorial article view with sidebar

import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Share2, Twitter, Linkedin, Link2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { Separator } from '@/components/ui/separator';
import { getBlogPost, CATEGORY_COLORS, BLOG_POSTS } from '@/data/blogPosts';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const BlogArticle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const post = id ? getBlogPost(id) : undefined;

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
        </div>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link copied!', description: 'Article URL copied to clipboard.' });
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${post.title} - Great read from @PitchPerfect`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  // Get related posts (same category, excluding current)
  const relatedPosts = BLOG_POSTS.filter(p => p.category === post.category && p.id !== post.id).slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <LazyImage
          src={post.image}
          alt={post.title}
          aspectRatio="auto"
          containerClassName="h-full"
          eager
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate('/blog')}
            className="gap-2 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Button>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto max-w-6xl px-4 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          {/* Main Content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-10 shadow-xl"
          >
            {/* Header */}
            <header className="mb-8">
              <Badge className={cn('mb-4 border', CATEGORY_COLORS[post.category])}>
                {post.category}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                {post.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {post.excerpt}
              </p>
              
              {/* Author & Meta */}
              <div className="flex items-center gap-4 pb-6 border-b border-border">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium">{post.author.name}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Article Body - Enhanced prose styling */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:mb-6
                prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-foreground prose-blockquote:my-8
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:my-2 prose-li:marker:text-primary
                prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:text-primary
                prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:my-8
                prose-hr:border-border prose-hr:my-10"
              dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
            />
          </motion.article>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Table of Contents */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                  Table of Contents
                </h3>
                <nav className="space-y-2">
                  {post.tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </motion.div>

              {/* Share Buttons */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleShareTwitter}>
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShareLinkedIn}>
                    <Linkedin className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>

              {/* CTA Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5"
              >
                <Sparkles className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Practice what you learned</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get real-time AI feedback on your presentation skills.
                </p>
                <Link to="/ai-coach">
                  <Button className="w-full" size="sm">
                    Try AI Coach
                  </Button>
                </Link>
              </motion.div>
            </div>
          </aside>
        </div>

        {/* Bottom CTA Banner */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="my-12 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-8 md:p-12"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to practice what you just read?</h2>
              <p className="text-muted-foreground">
                Get personalized AI coaching on your pitch delivery, body language, and speaking pace.
              </p>
            </div>
            <Link to="/ai-coach">
              <Button size="lg" className="gap-2 whitespace-nowrap">
                <Sparkles className="w-4 h-4" />
                Try AI Coach Now
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link 
                  key={relatedPost.id} 
                  to={`/blog/${relatedPost.id}`}
                  className="group"
                >
                  <div className="bg-card border border-border rounded-xl overflow-hidden flex transition-all duration-300 hover:shadow-lg hover:border-primary/30">
                    <div className="w-32 h-32 flex-shrink-0">
                      <LazyImage
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        aspectRatio="1/1"
                        containerClassName="h-full"
                      />
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <Badge className={cn('mb-2 w-fit border text-xs', CATEGORY_COLORS[relatedPost.category])}>
                        {relatedPost.category}
                      </Badge>
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// Helper function to convert markdown-style content to HTML with enhanced formatting
function formatContent(content: string): string {
  let html = content
    // Headers with IDs - add visual anchor icon
    .replace(/## (.+?) \{#(.+?)\}/g, '<h2 id="$2" class="group scroll-mt-24"><span class="relative">$1<a href="#$2" class="absolute -left-6 opacity-0 group-hover:opacity-50 transition-opacity text-primary">#</a></span></h2>')
    // Subheaders
    .replace(/### (.+)/g, '<h3>$1</h3>')
    // Bold text with emphasis
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic text
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Blockquotes with attribution styling
    .replace(/> "(.+?)" — (.+)/g, '<blockquote><p class="text-lg italic mb-3">"$1"</p><footer class="text-sm text-muted-foreground font-medium">— $2</footer></blockquote>')
    .replace(/> (.+)/g, '<blockquote><p class="text-lg">$1</p></blockquote>')
    // Code blocks with syntax highlighting style
    .replace(/```([\s\S]*?)```/g, '<pre class="relative"><div class="absolute top-3 right-3 text-xs text-muted-foreground uppercase tracking-wider">Code</div><code>$1</code></pre>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Horizontal rules / section dividers
    .replace(/---/g, '<hr class="my-10 border-t border-border" />')
    // Checkmark lists with styled cards
    .replace(/✅ \*\*(.+?):\*\* (.+)/g, '<div class="flex items-start gap-3 p-4 bg-success/5 border border-success/20 rounded-lg my-3"><span class="text-success text-lg flex-shrink-0">✅</span><div><strong class="text-foreground">$1:</strong> <span class="text-muted-foreground">$2</span></div></div>')
    .replace(/❌ \*\*(.+?):\*\* (.+)/g, '<div class="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg my-3"><span class="text-destructive text-lg flex-shrink-0">❌</span><div><strong class="text-foreground">$1:</strong> <span class="text-muted-foreground">$2</span></div></div>')
    // Bullet lists with proper structure
    .replace(/^- \*\*(.+?):\*\* (.+)$/gm, '<li class="my-2"><strong class="text-foreground">$1:</strong> <span class="text-muted-foreground">$2</span></li>')
    .replace(/^- (.+)$/gm, '<li class="my-2">$1</li>')
    // Numbered lists with visual styling
    .replace(/^(\d+)\. \*\*(.+?):\*\* (.+)$/gm, '<div class="flex items-start gap-4 my-4"><span class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">$1</span><div><strong class="text-foreground">$2:</strong> <span class="text-muted-foreground">$3</span></div></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex items-start gap-4 my-4"><span class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">$1</span><span class="text-muted-foreground pt-1">$2</span></div>');

  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul class="my-6 space-y-1 list-none pl-0">$&</ul>');
  
  // Handle paragraphs
  html = html
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p>')
    // Wrap in paragraph tags
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')
    // Clean up paragraphs around block elements
    .replace(/<p>(\s*<(?:h2|h3|blockquote|pre|div|ul|hr)[^>]*>)/g, '$1')
    .replace(/(<\/(?:h2|h3|blockquote|pre|div|ul|hr)>\s*)<\/p>/g, '$1');

  return html;
}

export default BlogArticle;
