import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Heart, Send, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import axios from 'axios';
import TownLoader from '@/components/shared/TownLoader';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8024';

export default function StoryViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    loadStory();
  }, [id]);

  // Progress bar animation
  useEffect(() => {
    if (!story || isPaused) return;

    const duration = story.media_type === 'video' ? 15000 : 5000; // 15s for video, 5s for image
    const interval = 50; // Update every 50ms
    const increment = (100 / duration) * interval;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleClose();
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [story, isPaused]);

  const loadStory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/stories/${id}`);
      setStory(response.data);
      console.log('✅ Story loaded:', response.data);
    } catch (error) {
      console.error('❌ Error loading story:', error);
      setError('Story not found or has expired');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diff = now - created;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <TownLoader size="lg" label="Loading story" className="[&_p]:text-white/80" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={40} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Story Not Found</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-white text-black rounded-control hover:bg-gray-200 transition-colors font-semibold shadow-soft-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black z-50"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700 z-10">
        <div
          className="h-full bg-white transition-all duration-50 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-[max(1rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/60 to-transparent z-10">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Profile Picture Placeholder */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center shadow-soft-sm">
              <span className="text-white font-bold text-sm">
                {story.user_id ? story.user_id.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {story.user_id || 'Anonymous'}
              </p>
              <p className="text-gray-300 text-xs truncate">
                {getTimeAgo(story.created_at)}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onClick={togglePause}
      >
        {story.media_type === 'video' ? (
          <video
            src={story.media_url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            loop
            playsInline
            onClick={(e) => {
              e.stopPropagation();
              e.target.paused ? e.target.play() : e.target.pause();
            }}
          />
        ) : (
          <img
            src={story.media_url}
            alt={story.caption || 'Story'}
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Pause Indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-6">
              <div className="flex gap-2">
                <div className="w-2 h-8 bg-white rounded-full"></div>
                <div className="w-2 h-8 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Caption & Info Overlay */}
      {(story.caption || story.location) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] sm:pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
          <div className="max-w-xl mx-auto space-y-2 pr-16 sm:pr-0">
            {story.caption && (
              <p className="text-white text-sm md:text-base font-medium line-clamp-4 break-words">
                {story.caption}
              </p>
            )}
            {story.location && (
              <div className="flex items-center gap-2 text-gray-300 text-xs md:text-sm min-w-0">
                <span className="shrink-0">📍</span>
                <span className="truncate">{story.location}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Story Stats - Bottom Right */}
      <div className="absolute bottom-[max(5rem,calc(env(safe-area-inset-bottom)+3.5rem))] sm:bottom-20 right-3 sm:right-4 flex flex-col items-center gap-3 sm:gap-4 z-10">
        {/* Views */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xl">👁️</span>
          </div>
          <span className="text-white text-xs font-medium mt-1">{story.views_count}</span>
        </div>

        {/* Time Remaining */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xl">⏰</span>
          </div>
          <span className="text-white text-[10px] font-medium mt-1 text-center">
            {getTimeRemaining(story.expires_at)}
          </span>
        </div>
      </div>

      {/* Navigation Arrows (Desktop) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(-1);
        }}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors"
      >
        <ChevronLeft size={28} className="text-white" />
      </motion.button>
    </motion.div>
  );
}
