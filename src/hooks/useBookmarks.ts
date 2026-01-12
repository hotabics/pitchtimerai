// Custom hook for managing blog article bookmarks in localStorage

import { useState, useEffect, useCallback } from 'react';

const BOOKMARKS_KEY = 'blog_bookmarks';

export interface BookmarkedArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  savedAt: string;
}

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  }, []);

  // Save bookmarks to localStorage whenever they change
  const saveToStorage = useCallback((newBookmarks: BookmarkedArticle[]) => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }, []);

  const addBookmark = useCallback((article: Omit<BookmarkedArticle, 'savedAt'>) => {
    const newBookmark: BookmarkedArticle = {
      ...article,
      savedAt: new Date().toISOString(),
    };
    
    setBookmarks(prev => {
      // Don't add duplicates
      if (prev.some(b => b.id === article.id)) {
        return prev;
      }
      const updated = [newBookmark, ...prev];
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeBookmark = useCallback((articleId: string) => {
    setBookmarks(prev => {
      const updated = prev.filter(b => b.id !== articleId);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const isBookmarked = useCallback((articleId: string): boolean => {
    return bookmarks.some(b => b.id === articleId);
  }, [bookmarks]);

  const toggleBookmark = useCallback((article: Omit<BookmarkedArticle, 'savedAt'>) => {
    if (isBookmarked(article.id)) {
      removeBookmark(article.id);
      return false;
    } else {
      addBookmark(article);
      return true;
    }
  }, [isBookmarked, addBookmark, removeBookmark]);

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,
  };
};
