import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart, Phone, RotateCcw, SlidersHorizontal, ChevronRight, ChevronLeft, Home, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { propertyAPI, activityAPI } from '../services/api';
import { useLocationContext } from '../context/LocationContext';
import { buildPropertySearchQuery, getLocationCityFilter } from '@/lib/buildPropertySearchQuery';
import { criteriaFromFeedSearch, syncSearchAlert } from '@/lib/searchAlerts';
import { useAuth } from '@/context/AuthContext';
import { PropertyCard } from './PropertyCard';
import { getApiErrorMessage } from '@/lib/apiErrors';
import LoadErrorState from "@/components/shared/LoadErrorState";
import ContextualEmptyState from "@/components/shared/ContextualEmptyState";
import { LocationPicker } from "@/components/shared/LocationPicker";
import { PropertyCardSkeletonGrid, PropertyCardSkeleton } from "@/components/shared/PropertyCardSkeleton";
import TownLoader from "@/components/shared/TownLoader";
import { MobileSwipeDeck } from '@/components/property/MobileSwipeDeck';

import AppNavbar from "@/components/shared/AppNavbar";

import { TownExchangeLogo } from './brand/TownExchangeLogo';

export default function PropertyFeed() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedLocation, locationLabel } = useLocationContext();
  const [category, setCategory] = useState('All Properties');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCause, setErrorCause] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [swipedCards, setSwipedCards] = useState([]);
  const [restoreDirection, setRestoreDirection] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const currentIndexRef = useRef(currentIndex);
  const swipeDeckRef = useRef(null);
  const reduceMotion = useReducedMotion() ?? false;

  const [sortBy, setSortBy] = useState('recent');
  const [filters, setFilters] = useState({
    bhkType: '',
    minPrice: '',
    maxPrice: '',
    propertyFor: '',
    propertyType: '',
    furnishing: '',
    parking: false,
    amenities: []
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (location.state?.category) {
      setCategory(location.state.category);
    }
    if (location.state?.propertyFor || location.state?.propertyType) {
      setFilters((prev) => ({
        ...prev,
        propertyFor: location.state.propertyFor || prev.propertyFor,
        propertyType: location.state.propertyType || prev.propertyType,
      }));
    }
    if (location.state?.query) {
      setSearchQuery(location.state.query);
      handleSearch({ preventDefault: () => {} }, location.state.query);
    }
    // Only ever meant to run once for the state that arrived with this navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    fetchProperties();
  }, [category, sortBy, filters, selectedLocation?.id]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    setErrorCause(null);
    try {
      const params = {};

      if (category !== 'All Properties') {
        params.category = category;
      }

      if (filters.minPrice) params.min_price = parseFloat(filters.minPrice);
      if (filters.maxPrice) params.max_price = parseFloat(filters.maxPrice);
      if (filters.bhkType) params.bhk_type = filters.bhkType;
      if (filters.propertyFor) params.property_for = filters.propertyFor;
      if (filters.propertyType) params.property_type = filters.propertyType;
      if (filters.furnishing) params.furnishing_status = filters.furnishing;
      const cityFilter = getLocationCityFilter(selectedLocation);
      if (cityFilter) params.city = cityFilter;

      const data = await propertyAPI.getProperties(params);

      let filteredData = [...data];

      if (sortBy === 'price_low') {
        filteredData.sort((a, b) => a.expected_price - b.expected_price);
      } else if (sortBy === 'price_high') {
        filteredData.sort((a, b) => b.expected_price - a.expected_price);
      } else if (sortBy === 'recent') {
        filteredData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      if (filters.parking) {
        filteredData = filteredData.filter(p => p.parking > 0);
      }

      setProperties(filteredData);
      setCurrentIndex(filteredData.length - 1);
      setSwipedCards([]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load properties. Please try again.'));
      setErrorCause(err);
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e, queryOverride) => {
    e.preventDefault();
    const query = (queryOverride ?? searchQuery).trim();
    if (!query) {
      fetchProperties();
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCause(null);
    try {
      const results = await propertyAPI.searchProperties(
        buildPropertySearchQuery(selectedLocation, query)
      );
      setProperties(results);
      setCurrentIndex(results.length - 1);
      setSwipedCards([]);
      if (user?.kyc_status === "verified") {
        activityAPI
          .trackSearch({
            search_query: query,
            location_text: selectedLocation?.name || undefined,
            property_type: filters.propertyType || undefined,
            transaction_type: filters.propertyFor || undefined,
          })
          .catch(() => {});
        syncSearchAlert(
          criteriaFromFeedSearch({
            query,
            city: getLocationCityFilter(selectedLocation),
            propertyFor: filters.propertyFor || undefined,
            propertyType: filters.propertyType || undefined,
            bhkType: filters.bhkType || undefined,
            minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
            maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
            category: category !== "All Properties" ? category : undefined,
            furnishingStatus: filters.furnishing || undefined,
          }),
          query
        );
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Search failed. Please try again.'));
      setErrorCause(err);
      console.error('Error searching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationPick = (location) => {
    handleSearch({ preventDefault: () => {} }, location.name);
  };

  const handleSaveProperty = async (propertyId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    try {
      const result = await propertyAPI.toggleFavourite(propertyId);
      setProperties(prevProperties =>
        prevProperties.map(property =>
          property.id === propertyId
            ? { ...property, is_favourite: result.is_favourite }
            : property
        )
      );
    } catch (err) {
      console.error('Error toggling favourite:', err);
      alert(getApiErrorMessage(err, 'Failed to update favourite. Please try again.'));
    }
  };

  const handlePropertyClick = (propertyId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    console.log('Navigating to property:', propertyId);
    navigate(`/property/${propertyId}`);
  };

  const handleCallClick = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 2000);
  };

  const handleImageClick = (propertyId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    console.log('Image clicked, navigating to property:', propertyId);
    navigate(`/property/${propertyId}`);
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    fetchProperties();
  };

  const clearFilters = () => {
    setFilters({
      bhkType: '',
      minPrice: '',
      maxPrice: '',
      propertyFor: '',
      propertyType: '',
      furnishing: '',
      parking: false,
      amenities: []
    });
    setSortBy('recent');
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Price not available';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Price not available';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const onCardLeftScreen = (direction, property, index) => {
    setSwipedCards(prev => [...prev, { property, index, direction }]);
    setCurrentIndex(prev => prev - 1);
    setRestoreDirection(null);

    if (direction === 'right' && property?.id) {
      handleSaveProperty(property.id);
    }
  };

  const resetCards = () => {
    setCurrentIndex(properties.length - 1);
    setSwipedCards([]);
    setRestoreDirection(null);
  };

  const goBack = () => {
    if (swipedCards.length === 0) return;

    const lastSwiped = swipedCards[swipedCards.length - 1];
    setRestoreDirection(lastSwiped.direction);
    setCurrentIndex(lastSwiped.index);
    setSwipedCards(prev => prev.slice(0, -1));
  };

  const MobileSwipeCard = ({ property, isSwipeable = false }) => (
    <div
      className={`bg-white rounded-card shadow-soft-sm border border-gray-100 hover:shadow-soft-lg overflow-hidden flex flex-col transition-all duration-200 ${
        isSwipeable ? 'h-[min(calc(100dvh-18rem),500px)]' : 'hover:-translate-y-1'
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          isSwipeable ? 'h-2/5' : 'h-36 sm:h-40 md:h-44'
        }`}
      >
        <div
          className="w-full h-full cursor-pointer"
          onClick={(e) => handleImageClick(property.id, e)}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
        >
          <img
            src={property.images && property.images.length > 0 && property.images[0].url
              ? property.images[0].url
              : 'https://via.placeholder.com/400x300?text=No+Image'}
            alt={property.apartment_name || 'Property'}
            className="w-full h-full object-cover pointer-events-none"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
            }}
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />
        {property.property_for && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded font-medium shadow-soft-sm pointer-events-none">
            For {property.property_for}
          </div>
        )}
        <button
          onClick={(e) => handleSaveProperty(property.id, e)}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleSaveProperty(property.id, e);
          }}
          className="absolute top-2 right-2 bg-white p-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-soft-sm z-10"
        >
          <Heart
            size={16}
            className={property.is_favourite ? 'fill-red-500 text-red-500' : 'text-gray-600'}
          />
        </button>
      </div>

      <div className={`p-3 flex flex-col flex-grow ${isSwipeable ? 'overflow-y-auto' : ''}`}>
        <div className="mb-2">
          <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 leading-tight">
            {property.bhk_type || 'N/A'} {property.apartment_type || 'Property'}
            {property.apartment_name && ` in ${property.apartment_name}`}
          </h3>
          <p className="text-lg font-bold text-brand-600">
            {formatPrice(property.expected_price)}
            {property.property_for === 'Rent/Lease' && property.expected_price && (
              <span className="text-xs text-gray-500 font-normal">/month</span>
            )}
          </p>
        </div>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin size={12} className="mr-1 flex-shrink-0 text-gray-400" />
          <span className="text-xs line-clamp-1">
            {property.locality || 'Location'}, {property.city || 'City'}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-2 text-gray-600 flex-wrap">
          {property.bhk_type && property.bhk_type.split(' ')[0] !== 'Studio' && (
            <div className="flex items-center gap-1">
              <Bed size={14} className="text-gray-400" />
              <span className="text-xs">{property.bhk_type.split(' ')[0]}</span>
            </div>
          )}
          {property.bathrooms !== undefined && property.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath size={14} className="text-gray-400" />
              <span className="text-xs">{property.bathrooms}</span>
            </div>
          )}
          {property.carpet_area && property.carpet_area > 0 && (
            <div className="flex items-center gap-1">
              <Square size={14} className="text-gray-400" />
              <span className="text-xs">{property.carpet_area} sqft</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2 pb-2 border-t pt-2">
          <span>By: <span className="font-medium text-gray-700">{property.user_type || 'N/A'}</span></span>
          <span>{property.created_at ? new Date(property.created_at).toLocaleDateString('en-IN') : 'N/A'}</span>
        </div>

        <div className="mt-auto">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={(e) => handlePropertyClick(property.id, e)}
              onTouchEnd={(e) => {
                e.preventDefault();
                handlePropertyClick(property.id, e);
              }}
              className="col-span-2 py-1.5 px-2 rounded-control text-white font-medium text-xs transition-colors flex items-center justify-center gap-1 z-10 bg-brand-500 hover:bg-brand-700"
            >
              <span>View Details</span>
            </button>

            <button
              onClick={(e) => handleCallClick(e)}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleCallClick(e);
              }}
              className="py-1.5 px-2 rounded-control border border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-medium text-xs transition-colors flex items-center justify-center z-10"
            >
              <Phone size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const hasActiveFilters = filters.bhkType || filters.minPrice || filters.maxPrice || filters.propertyFor || filters.furnishing || filters.parking;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <AppNavbar
        variant="inner"
        backTo="/home"
        maxWidth="7xl"
        logoTagline="Property Marketplace"
        showLocation
      />

      {/* Breadcrumbs - Desktop Only */}
      <div className="hidden md:block bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-gray-600 hover:text-brand-600 transition-colors group"
            >
              <Home size={16} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Home</span>
            </button>
            <ChevronRight size={16} className="text-gray-400" />
            <span className="text-brand-600 font-semibold">{category}</span>
          </nav>
        </div>
      </div>

      {/* Combined Search and Filter Section */}
      <div className="bg-white border-b border-gray-200 sticky top-[48px] sm:top-[52px] md:top-[85px] z-40 shadow-soft-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
            {/* Search Bar */}
            <LocationPicker
              mode="freetext"
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={() => handleSearch({ preventDefault: () => {} })}
              onSelectLocation={handleLocationPick}
              placeholder="Search location, type, keyword..."
              recentScope="property-feed"
              className="flex-1 min-w-0 w-full"
            />

            {/* Filter Button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-control text-sm font-medium whitespace-nowrap transition-all border ${
                hasActiveFilters
                  ? 'bg-brand-50 text-brand-700 border-brand-300 shadow-soft-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={18} />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
                </span>
              )}
            </button>
          </div>

          {/* Sort Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-sm text-gray-600 font-medium whitespace-nowrap mr-1">Sort by:</span>

            <button
              onClick={() => setSortBy('recent')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                sortBy === 'recent'
                  ? 'bg-brand-500 text-white shadow-soft-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy('price_low')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                sortBy === 'price_low'
                  ? 'bg-brand-500 text-white shadow-soft-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Price: Low to High
            </button>
            <button
              onClick={() => setSortBy('price_high')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                sortBy === 'price_high'
                  ? 'bg-brand-500 text-white shadow-soft-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Price: High to Low
            </button>
          </div>
        </div>
      </div>

      {/* Properties Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {loading ? (
          isMobile ? (
            <div className="flex justify-center py-6">
              <PropertyCardSkeleton compact className="w-full max-w-md" />
            </div>
          ) : (
            <PropertyCardSkeletonGrid count={8} />
          )
        ) : error ? (
          <LoadErrorState
            title="Couldn't load properties"
            message={error}
            error={errorCause}
            onRetry={fetchProperties}
          />
        ) : properties.length === 0 ? (
          <ContextualEmptyState
            title={`No properties in ${locationLabel} yet`}
            description="Try widening your search, clearing filters, or picking a nearby district."
            actionLabel="Clear filters & search"
            onAction={() => {
              setSearchQuery('');
              clearFilters();
              fetchProperties();
            }}
          />
        ) : isMobile ? (
          <div className="relative">
            {currentIndex < 0 ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-[min(calc(100dvh-16rem),520px)]"
              >
                <div className="text-center p-6">
                  <motion.div
                    animate={reduceMotion ? undefined : { rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                    className="w-20 h-20 mx-auto mb-4 bg-brand-50 rounded-full flex items-center justify-center"
                  >
                    <TownExchangeLogo size={56} variant="full" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No More Properties
                  </h3>
                  <p className="text-gray-600 text-sm mb-6">
                    You&apos;ve viewed all available properties
                  </p>
                  <motion.button
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    onClick={resetCards}
                    className="px-6 py-2.5 rounded-control text-white font-medium text-sm transition-all shadow-soft-md hover:shadow-brand-glow flex items-center justify-center gap-2 mx-auto bg-brand-500 hover:bg-brand-700"
                  >
                    <RotateCcw size={18} />
                    <span>View Again</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="relative h-[min(calc(100dvh-16rem),520px)] flex items-start justify-center pt-2">
                  <MobileSwipeDeck
                    ref={swipeDeckRef}
                    properties={properties}
                    topIndex={currentIndex}
                    restoreDirection={restoreDirection}
                    onSwipe={onCardLeftScreen}
                    className="h-full"
                    renderCard={(property, isTop) => (
                      <MobileSwipeCard property={property} isSwipeable={isTop} />
                    )}
                  />
                </div>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600 font-medium">
                    {currentIndex >= 0 ? properties.length - currentIndex : 0} of {properties.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Swipe right to save · left to skip
                  </p>
                </div>

                <div className="flex justify-center items-center gap-4 mt-6">
                  <motion.button
                    whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                    onClick={goBack}
                    disabled={swipedCards.length === 0}
                    className={`w-12 h-12 rounded-full bg-white border border-gray-300 shadow-soft-md flex items-center justify-center transition-all ${
                      swipedCards.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 hover:shadow-soft-lg'
                    }`}
                    aria-label="Undo last swipe"
                  >
                    <RotateCcw size={20} className="text-gray-600" />
                  </motion.button>

                  <motion.button
                    whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                    onClick={() => swipeDeckRef.current?.swipe('left')}
                    disabled={currentIndex < 0}
                    className="w-14 h-14 rounded-full bg-white border-2 border-rose-200 shadow-soft-md flex items-center justify-center hover:bg-rose-50 transition-all"
                    aria-label="Skip property"
                  >
                    <X size={24} className="text-rose-500" />
                  </motion.button>

                  <motion.button
                    whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                    onClick={() => {
                      if (currentIndex >= 0) handleSaveProperty(properties[currentIndex].id);
                    }}
                    disabled={currentIndex < 0}
                    className="w-12 h-12 rounded-full bg-white border border-gray-300 shadow-soft-md flex items-center justify-center hover:bg-gray-50 hover:shadow-soft-lg transition-all"
                    aria-label="Toggle favourite"
                  >
                    <Heart
                      size={22}
                      className={
                        currentIndex >= 0 && properties[currentIndex]?.is_favourite
                          ? 'fill-red-500 text-red-500'
                          : 'text-red-500'
                      }
                    />
                  </motion.button>

                  <motion.button
                    whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                    onClick={() => swipeDeckRef.current?.swipe('right')}
                    disabled={currentIndex < 0}
                    className="w-14 h-14 rounded-full bg-white border-2 border-emerald-200 shadow-soft-md flex items-center justify-center hover:bg-emerald-50 transition-all"
                    aria-label="Save and next"
                  >
                    <Heart size={24} className="text-emerald-500 fill-emerald-500" />
                  </motion.button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Desktop: Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onOpenDetails={(id) => navigate(`/property/${id}`, { state: { from: '/property-feed' } })}
                onFavouriteChange={(id, isFav) =>
                  setProperties((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, is_favourite: isFav } : p))
                  )
                }
                onCall={handleCallClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Coming Soon Toast */}
      {showComingSoon && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[9999]">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl">
            <p className="text-sm font-medium">📞 Call feature coming soon!</p>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-end md:items-center justify-center backdrop-blur-sm px-2 safe-bottom">
          <div className="bg-white w-full md:w-[520px] md:rounded-card rounded-t-card max-h-[92dvh] overflow-y-auto shadow-soft-lg">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filter Properties</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">BHK Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', 'Studio'].map((bhk) => (
                    <button
                      key={bhk}
                      onClick={() => setFilters(prev => ({ ...prev, bhkType: prev.bhkType === bhk ? '' : bhk }))}
                      className={`py-2 px-3 rounded-control text-xs font-medium transition-all border ${
                        filters.bhkType === bhk ? 'bg-brand-50 text-brand-700 border-brand-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {bhk}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property For</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Sell', 'Rent/Lease'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilters(prev => ({ ...prev, propertyFor: prev.propertyFor === type ? '' : type }))}
                      className={`py-2.5 px-3 rounded-control text-sm font-medium transition-all border ${
                        filters.propertyFor === type ? 'bg-brand-50 text-brand-700 border-brand-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (₹)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-control focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-control focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Furnishing Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Furnished', 'Semi-Furnished', 'Unfurnished'].map((furnish) => (
                    <button
                      key={furnish}
                      onClick={() => setFilters(prev => ({ ...prev, furnishing: prev.furnishing === furnish ? '' : furnish }))}
                      className={`py-2 px-2 rounded-control text-xs font-medium transition-all border ${
                        filters.furnishing === furnish ? 'bg-brand-50 text-brand-700 border-brand-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {furnish}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Features</label>
                <label className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-control cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                  <input
                    type="checkbox"
                    checked={filters.parking}
                    onChange={(e) => setFilters(prev => ({ ...prev, parking: e.target.checked }))}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Parking Available</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-4 flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-2.5 px-4 rounded-control border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-2.5 px-4 rounded-control text-white font-medium text-sm transition-colors bg-brand-500 hover:bg-brand-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
