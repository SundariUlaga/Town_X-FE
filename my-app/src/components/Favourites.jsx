import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, HeartOff } from 'lucide-react';
import { propertyAPI } from '../services/api';
import { PropertyCard } from './PropertyCard';
import { getApiErrorMessage } from '@/lib/apiErrors';
import LoadErrorState from "@/components/shared/LoadErrorState";
import ContextualEmptyState from "@/components/shared/ContextualEmptyState";
import { PropertyCardSkeletonGrid } from "@/components/shared/PropertyCardSkeleton";
import AppNavbar from "@/components/shared/AppNavbar";

export default function Favourites() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [errorCause, setErrorCause] = useState(null);

  useEffect(() => {
    loadFavourites();
  }, []);

  const loadFavourites = async () => {
    setLoading(true);
    setError(null);
    setErrorCause(null);

    try {
      const favourites = await propertyAPI.getFavourites();
      setProperties(favourites);
    } catch (err) {
      console.error('Error loading favourites:', err);
      setError(getApiErrorMessage(err, 'Could not load favourites. Please try again.'));
      setErrorCause(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (propertyId) => {
    navigate(`/property/${propertyId}`, { state: { from: '/favourites' } });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadFavourites();
      return;
    }

    const filtered = properties.filter(property =>
      property.locality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.apartment_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setProperties(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <AppNavbar variant="inner" backTo="/home" maxWidth="7xl" />

      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 max-w-7xl mx-auto">
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search favourites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 md:py-2.5 text-sm md:text-base border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
          />
        </form>
      </div>

      <div className="bg-gradient-to-r from-brand-600 via-secondary-500 to-brand-700 text-white px-4 py-4 md:py-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Heart className="w-8 h-8 md:w-10 md:h-10 fill-white" />
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">My Favourites</h1>
            <p className="text-sm md:text-base opacity-90">
              {loading
                ? "Loading your saved listings…"
                : `${properties.length} saved ${properties.length === 1 ? "property" : "properties"}`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading && <PropertyCardSkeletonGrid count={4} />}

        {error && (
          <LoadErrorState
            message={error}
            error={errorCause}
            onRetry={loadFavourites}
          />
        )}

        {!loading && !error && properties.length === 0 && (
          <ContextualEmptyState
            title="No saved properties yet"
            description="Tap the heart icon on any listing to save it here for later."
            actionLabel="Browse properties"
            onAction={() => navigate("/property-feed")}
            icon={<HeartOff className="size-6" />}
          />
        )}

        {!loading && !error && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onOpenDetails={handlePropertyClick}
                onFavouriteChange={(id, isFav) => {
                  if (!isFav) {
                    setProperties((prev) => prev.filter((p) => p.id !== id));
                  } else {
                    setProperties((prev) =>
                      prev.map((p) => (p.id === id ? { ...p, is_favourite: isFav } : p))
                    );
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
