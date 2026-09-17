import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart, Phone, RotateCcw, SlidersHorizontal, ChevronRight, ChevronLeft, Home, X, LayoutGrid, Map } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { propertyAPI, activityAPI } from '../services/api';
import { useLocationContext } from '../context/LocationContext';
import { buildPropertySearchQuery, getLocationFilterParams, getLocationCityFilter } from '@/lib/buildPropertySearchQuery';
import { LocationCascadeFilter } from '@/components/shared/LocationCascadeFilter';
import { criteriaFromFeedSearch, syncSearchAlert } from '@/lib/searchAlerts';
import { useAuth, ROLE_HOME_ROUTE } from '@/context/AuthContext';
import { PropertyCard } from './PropertyCard';
import { getApiErrorMessage } from '@/lib/apiErrors';
import LoadErrorState from "@/components/shared/LoadErrorState";
import ContextualEmptyState from "@/components/shared/ContextualEmptyState";
import { LocationPicker } from "@/components/shared/LocationPicker";
import { PropertyCardSkeletonGrid, PropertyCardSkeleton } from "@/components/shared/PropertyCardSkeleton";
import TownLoader from "@/components/shared/TownLoader";
import { MobileSwipeDeck } from '@/components/property/MobileSwipeDeck';
import { PropertyMapView } from '@/components/property/PropertyMapView';

import AppNavbar from "@/components/shared/AppNavbar";

import { TownExchangeLogo } from './brand/TownExchangeLogo';
import { WithTooltip } from "@/components/ui/WithTooltip";
import { useToast } from "@/components/ui/toast";
import { useCompare } from "@/context/CompareContext";
import { Dropdown } from "@/components/ui/dropdown";
import { Pagination } from "@/components/ui/pagination";
import { useClientPagination } from "@/hooks/useClientPagination";

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];

const FEED_PAGE_SIZE = 12;

export default function PropertyFeed() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { toggle: toggleCompare, isComparing } = useCompare();
  const homeRoute = user ? ROLE_HOME_ROUTE[user.role] : "/home";
  const { selectedLocation, locationLabel, setSelectedLocation } = useLocationContext();
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
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [mapSelectedId, setMapSelectedId] = useState(null);
  const [filters, setFilters] = useState({
    bhkType: '',
    minPrice: '',
    maxPrice: '',
    propertyFor: '',
    propertyType: '',
    furnishing: '',
    parking: false,
    amenities: [],
    postedBy: '',
    apartmentType: '',
  });

  const feedPagination = useClientPagination(properties, FEED_PAGE_SIZE);
  const {
    page: feedPage,
    setPage: setFeedPage,
    pageCount: feedPageCount,
    pageItems: pagedProperties,
    pageSize: feedPageSize,
    totalItems: feedTotal,
  } = feedPagination;

  useEffect(() => {
    setFeedPage(1);
  }, [sortBy, category, filters, selectedLocation?.id, setFeedPage]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && viewMode === 'map') setViewMode('list');
  }, [isMobile, viewMode]);

  useEffect(() => {
    const state = location.state;
    if (!state) return;

    if (state.category !== undefined && state.category !== null) {
      setCategory(state.category || "All Properties");
    }

    if (state.resetFilters) {
      setFilters({
        bhkType: "",
        minPrice: "",
        maxPrice: "",
        propertyFor: state.propertyFor || "",
        propertyType: state.propertyType || "",
        furnishing: "",
        parking: false,
        amenities: [],
        postedBy: "",
        apartmentType: "",
      });
    } else if (
      state.propertyFor !== undefined ||
      state.propertyType !== undefined ||
      state.bhkType !== undefined ||
      state.minPrice !== undefined ||
      state.maxPrice !== undefined ||
      state.furnishing !== undefined ||
      state.amenities !== undefined ||
      state.postedBy !== undefined ||
      state.apartmentType !== undefined
    ) {
      setFilters((prev) => ({
        ...prev,
        ...(state.propertyFor !== undefined
          ? { propertyFor: state.propertyFor || "" }
          : {}),
        ...(state.propertyType !== undefined
          ? { propertyType: state.propertyType || "" }
          : {}),
        ...(state.bhkType !== undefined ? { bhkType: state.bhkType || "" } : {}),
        ...(state.minPrice !== undefined ? { minPrice: state.minPrice || "" } : {}),
        ...(state.maxPrice !== undefined ? { maxPrice: state.maxPrice || "" } : {}),
        ...(state.furnishing !== undefined
          ? { furnishing: state.furnishing || "" }
          : {}),
        ...(state.amenities !== undefined
          ? {
              amenities: Array.isArray(state.amenities) ? state.amenities : prev.amenities,
            }
          : {}),
        ...(state.postedBy !== undefined ? { postedBy: state.postedBy || "" } : {}),
        ...(state.apartmentType !== undefined
          ? { apartmentType: state.apartmentType || "" }
          : {}),
      }));
    }

    if (state.query) {
      setSearchQuery(state.query);
      handleSearch({ preventDefault: () => {} }, state.query);
    }
    // Re-apply whenever this navigation entry changes (home chips → feed).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

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
      Object.assign(params, getLocationFilterParams(selectedLocation));

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

      if (filters.amenities?.length) {
        filteredData = filteredData.filter((p) => {
          const list = Array.isArray(p.amenities) ? p.amenities : [];
          return filters.amenities.every((a) =>
            list.some((item) => String(item).toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(String(item).toLowerCase()))
          );
        });
      }

      if (filters.postedBy) {
        filteredData = filteredData.filter(
          (p) => String(p.user_type || "").toLowerCase() === filters.postedBy.toLowerCase()
        );
      }

      if (filters.apartmentType && filters.apartmentType !== "Commercial") {
        const needle = filters.apartmentType.toLowerCase();
        filteredData = filteredData.filter((p) =>
          String(p.apartment_type || "").toLowerCase().includes(needle.replace("/land", ""))
        );
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
      toast(getApiErrorMessage(err, 'Failed to update favourite. Please try again.'), 'error');
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
      amenities: [],
      postedBy: '',
      apartmentType: '',
    });
    setSortBy('recent');
  };

  const removeFilter = (key) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (key === 'parking') next.parking = false;
      else if (key === 'amenities') next.amenities = [];
      else if (key === 'price') {
        next.minPrice = '';
        next.maxPrice = '';
      } else {
        next[key] = '';
      }
      return next;
    });
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
        isSwipeable ? 'h-[min(calc(100dvh-18rem),500px)]' : 'hover:-translate-y-1 cursor-pointer'
      }`}
      onClick={!isSwipeable ? (e) => handlePropertyClick(property.id, e) : undefined}
    >
      <div
        className={`relative overflow-hidden bg-gray-100 ${
          isSwipeable ? 'h-2/5' : 'h-36 sm:h-40 md:h-44'
        }`}
      >
        <div
          className="w-full h-full cursor-pointer overflow-hidden"
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
            className="h-full w-full max-w-full object-cover pointer-events-none"
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
        <WithTooltip
          label={property.is_favourite ? "Remove from favourites" : "Save to favourites"}
        >
          <button
            onClick={(e) => handleSaveProperty(property.id, e)}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleSaveProperty(property.id, e);
            }}
            className="absolute top-2 right-2 bg-white p-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-soft-sm z-10"
            aria-label={property.is_favourite ? "Remove from favourites" : "Save to favourites"}
          >
            <Heart
              size={16}
              className={property.is_favourite ? 'fill-red-500 text-red-500' : 'text-gray-600'}
            />
          </button>
        </WithTooltip>
      </div>

        <div className={`p-3 flex flex-col flex-grow ${isSwipeable ? 'overflow-y-auto' : ''}`}>
        <div className="mb-2">
          <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 leading-tight">
            {property.property_type === 'Commercial'
              ? `${property.commercial_subtype || property.apartment_type || 'Commercial'}${
                  property.apartment_name ? ` · ${property.apartment_name}` : ''
                }`
              : `${property.bhk_type || 'N/A'} ${property.apartment_type || 'Property'}${
                  property.apartment_name ? ` in ${property.apartment_name}` : ''
                }`}
          </h3>
          <p className="text-lg font-bold text-brand-700">
            {formatPrice(property.expected_price)}
            {property.property_for === 'Rent/Lease' && property.expected_price && (
              <span className="text-xs text-gray-500 font-normal">/month</span>
            )}
          </p>
          {property.property_for !== 'Rent/Lease' &&
            property.carpet_area > 0 &&
            property.expected_price > 0 && (
              <p className="text-[11px] font-medium text-gray-500">
                ₹{Math.round(property.expected_price / property.carpet_area).toLocaleString('en-IN')}/sqft
              </p>
            )}
          {property.verification_tier === 'verified' ? (
            <span className="mt-1 inline-flex items-center rounded-full bg-trust-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Verified
            </span>
          ) : null}
        </div>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin size={12} className="mr-1 flex-shrink-0 text-gray-400" />
          <span className="text-xs line-clamp-1">
            {property.locality || 'Location'}, {property.city || 'City'}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-2 text-gray-600 flex-wrap">
          {property.property_type === 'Commercial' ? (
            <>
              {property.carpet_area > 0 ? (
                <div className="flex items-center gap-1">
                  <Square size={14} className="text-gray-400" />
                  <span className="text-xs">{property.carpet_area} sqft</span>
                </div>
              ) : null}
              {property.frontage_ft ? (
                <span className="text-xs">{property.frontage_ft} ft frontage</span>
              ) : null}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2 pb-2 border-t pt-2">
          <span>By: <span className="font-medium text-gray-700">{property.user_type || 'N/A'}</span></span>
          <span>{property.created_at ? new Date(property.created_at).toLocaleDateString('en-IN') : 'N/A'}</span>
        </div>

        <div className="mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCallClick(e);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCallClick(e);
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-control border border-emerald-600 py-1.5 px-2 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 z-10"
          >
            <Phone size={14} />
            Call
          </button>
        </div>
      </div>
    </div>
  );

  const hasActiveFilters = Boolean(
    filters.bhkType ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.propertyFor ||
      filters.propertyType ||
      filters.furnishing ||
      filters.parking ||
      filters.postedBy ||
      filters.apartmentType ||
      (filters.amenities && filters.amenities.length > 0)
  );

  const activeFilterChips = [];
  if (filters.propertyFor) {
    activeFilterChips.push({
      key: 'propertyFor',
      label: filters.propertyFor === 'Sell' ? 'For Sale' : filters.propertyFor,
    });
  }
  if (filters.bhkType) activeFilterChips.push({ key: 'bhkType', label: filters.bhkType });
  if (filters.furnishing) activeFilterChips.push({ key: 'furnishing', label: filters.furnishing });
  if (filters.propertyType) activeFilterChips.push({ key: 'propertyType', label: filters.propertyType });
  if (filters.apartmentType) activeFilterChips.push({ key: 'apartmentType', label: filters.apartmentType });
  if (filters.postedBy) activeFilterChips.push({ key: 'postedBy', label: filters.postedBy });
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ? `₹${Number(filters.minPrice).toLocaleString('en-IN')}` : 'Any';
    const max = filters.maxPrice ? `₹${Number(filters.maxPrice).toLocaleString('en-IN')}` : 'Any';
    activeFilterChips.push({ key: 'price', label: `${min} – ${max}` });
  }
  if (filters.parking) activeFilterChips.push({ key: 'parking', label: 'Parking' });
  if (filters.amenities?.length) {
    activeFilterChips.push({ key: 'amenities', label: `${filters.amenities.length} amenities` });
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <AppNavbar
        variant="inner"
        backTo={homeRoute}
        maxWidth="full"
        showLocation
      />

      {/* Breadcrumbs - Desktop Only */}
      <div className="hidden md:block bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="max-w-[90rem] mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigate(homeRoute)}
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
        <div className="max-w-[90rem] mx-auto px-3 sm:px-4 py-3 sm:py-4">
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

            {/* Filter Button — modal on Browse (vs sidebar on Home) keeps the grid fullscreen */}
            <WithTooltip label={hasActiveFilters ? "Edit active filters" : "Open filters"}>
              <button
                onClick={() => setShowFilterModal(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-control text-sm font-medium whitespace-nowrap transition-all border ${
                  hasActiveFilters
                    ? 'bg-brand-50 text-brand-700 border-brand-300 shadow-soft-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                aria-label="Open filters"
              >
                <SlidersHorizontal size={18} />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters ? (
                  <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                    {activeFilterChips.length}
                  </span>
                ) : null}
              </button>
            </WithTooltip>
          </div>

          {activeFilterChips.length > 0 ? (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Active:</span>
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => removeFilter(chip.key)}
                  className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 hover:bg-brand-100"
                >
                  {chip.label}
                  <X size={12} className="opacity-70" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-gray-500 hover:text-brand-700 hover:underline"
              >
                Clear all
              </button>
            </div>
          ) : null}

          {/* Sort + view toggle */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Dropdown
                value={sortBy}
                onChange={setSortBy}
                options={SORT_OPTIONS}
                aria-label="Sort listings"
                size="sm"
                className="w-full max-w-[16rem] sm:w-auto"
                triggerClassName="bg-white"
              />
            </div>

            {!isMobile ? (
              <div className="hidden sm:inline-flex shrink-0 rounded-control border border-gray-200 bg-gray-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-1.5 rounded-[0.5rem] px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === 'list' ? 'bg-white text-brand-800 shadow-soft-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-pressed={viewMode === 'list'}
                >
                  <LayoutGrid className="size-3.5" />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`inline-flex items-center gap-1.5 rounded-[0.5rem] px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === 'map' ? 'bg-white text-brand-800 shadow-soft-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-pressed={viewMode === 'map'}
                >
                  <Map className="size-3.5" />
                  Map
                </button>
              </div>
            ) : null}
          </div>

          {!loading && !error && properties.length > 0 ? (
            <p className="mt-2 text-xs text-gray-500">
              {properties.length} result{properties.length === 1 ? '' : 's'}
              {viewMode === 'map' && !isMobile ? ' · click a pin to highlight' : ''}
            </p>
          ) : null}
        </div>
      </div>

      {/* Properties Content */}
      <div className="max-w-[90rem] mx-auto px-4 py-6 pb-24">
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
          (() => {
            const hasSearch = Boolean(searchQuery.trim());
            const hasFilters = Boolean(hasActiveFilters);
            const hasLocation = Boolean(selectedLocation);
            let title = "No properties found";
            let description = "Try a different location or adjust your filters.";
            let actionLabel = "Try again";
            if (hasSearch && hasFilters) {
              title = `No matches for “${searchQuery.trim()}”`;
              description =
                "Nothing matched both your search and filters. Clear one or both to see more listings.";
              actionLabel = "Clear search & filters";
            } else if (hasSearch) {
              title = `No matches for “${searchQuery.trim()}”`;
              description = "Try a shorter keyword, another spelling, or clear the search.";
              actionLabel = "Clear search";
            } else if (hasFilters) {
              title = "No properties match these filters";
              description =
                "Widen price, BHK, or other filters — or clear them to see everything in this area.";
              actionLabel = "Clear filters";
            } else if (hasLocation) {
              title = `No properties in ${locationLabel} yet`;
              description =
                "Try a nearby taluk or zone, or clear location to browse all listings.";
              actionLabel = "Clear location";
            }
            return (
              <ContextualEmptyState
                title={title}
                description={description}
                actionLabel={actionLabel}
                onAction={() => {
                  if (hasSearch) setSearchQuery("");
                  if (hasFilters) clearFilters();
                  if (!hasSearch && !hasFilters && hasLocation) {
                    setSelectedLocation(null);
                  }
                  // After search/filter clear, refetch; location change also triggers via effect
                  if (hasSearch || hasFilters || !hasLocation) {
                    setTimeout(() => fetchProperties(), 0);
                  }
                }}
              />
            );
          })()
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
                  <WithTooltip label="Undo last swipe">
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
                  </WithTooltip>

                  <WithTooltip label="Skip this property">
                    <motion.button
                      whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                      onClick={() => swipeDeckRef.current?.swipe('left')}
                      disabled={currentIndex < 0}
                      className="w-14 h-14 rounded-full bg-white border-2 border-rose-200 shadow-soft-md flex items-center justify-center hover:bg-rose-50 transition-all"
                      aria-label="Skip property"
                    >
                      <X size={24} className="text-rose-500" />
                    </motion.button>
                  </WithTooltip>

                  <WithTooltip label="Toggle favourite">
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
                  </WithTooltip>

                  <WithTooltip label="Save and go next">
                    <motion.button
                      whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                      onClick={() => swipeDeckRef.current?.swipe('right')}
                      disabled={currentIndex < 0}
                      className="w-14 h-14 rounded-full bg-white border-2 border-emerald-200 shadow-soft-md flex items-center justify-center hover:bg-emerald-50 transition-all"
                      aria-label="Save and next"
                    >
                      <Heart size={24} className="text-emerald-500 fill-emerald-500" />
                    </motion.button>
                  </WithTooltip>
                </div>
              </>
            )}
          </div>
        ) : viewMode === 'map' ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] lg:gap-5">
            <PropertyMapView
              properties={properties}
              selectedId={mapSelectedId}
              onSelect={setMapSelectedId}
              onOpenDetails={(id) => navigate(`/property/${id}`, { state: { from: '/property-feed' } })}
              className="min-h-[min(55vh,520px)] h-[min(70vh,640px)] w-full"
            />
            <div className="flex max-h-[min(70vh,640px)] flex-col gap-3">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {pagedProperties.map((property) => (
                  <button
                    key={property.id}
                    type="button"
                    onClick={() => setMapSelectedId(property.id)}
                    onDoubleClick={() =>
                      navigate(`/property/${property.id}`, { state: { from: '/property-feed' } })
                    }
                    className={`w-full rounded-card border p-3 text-left transition-colors ${
                      mapSelectedId === property.id
                        ? 'border-brand-500 bg-brand-50/70 shadow-soft-sm'
                        : 'border-border bg-card hover:border-brand-200'
                    }`}
                  >
                    <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                      {property.bhk_type} {property.apartment_type}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                      {property.locality}, {property.city}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-700">
                      {property.expected_price
                        ? new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            notation: 'compact',
                            maximumFractionDigits: 1,
                          }).format(property.expected_price)
                        : '—'}
                    </p>
                  </button>
                ))}
              </div>
              <Pagination
                page={feedPage}
                pageCount={feedPageCount}
                onPageChange={setFeedPage}
                totalItems={feedTotal}
                pageSize={feedPageSize}
                compact
              />
            </div>
          </div>
        ) : (
          /* Desktop: Grid View */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5">
              {pagedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onOpenDetails={(id) => navigate(`/property/${id}`, { state: { from: '/property-feed' } })}
                  onFavouriteChange={(id, isFav) =>
                    setProperties((prev) =>
                      prev.map((p) => (p.id === id ? { ...p, is_favourite: isFav } : p))
                    )
                  }
                  onCompareToggle={toggleCompare}
                  isComparing={isComparing(property.id)}
                  onCall={handleCallClick}
                />
              ))}
            </div>
            <Pagination
              page={feedPage}
              pageCount={feedPageCount}
              onPageChange={(p) => {
                setFeedPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              totalItems={feedTotal}
              pageSize={feedPageSize}
            />
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
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Narrow this browse view — same criteria as Home, in a focused panel.
                </p>
              </div>
              <WithTooltip label="Close filters">
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                  aria-label="Close filters"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </WithTooltip>
            </div>

            <div className="p-5 space-y-5">
              <LocationCascadeFilter />

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
