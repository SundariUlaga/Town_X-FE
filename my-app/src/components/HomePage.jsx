import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  X,
  Plus,
  Home,
  AlertCircle,
  Heart,
  Camera,
  Building2,
  Megaphone,
  Users2,
} from "lucide-react";
import axios from "axios";
import { propertyAPI, activityAPI, recommendationsAPI } from "../services/api";
import { configAPI } from "../services/configAPI";
import { DynamicIcon } from "./DynamicIcon";
import StoryUploadModal from "./StoryUploadModal";
import CreatePostModal from "./CreatePostModal";
import { useAuth, ROLE_HOME_ROUTE } from "../context/AuthContext";
import { useLocationContext } from "../context/LocationContext";
import { buildPropertySearchQuery } from "@/lib/buildPropertySearchQuery";
import { getLocationCityFilter } from "@/lib/locationUtils";
import { criteriaFromFeedSearch, syncSearchAlert } from "@/lib/searchAlerts";
import { AdvertisementSlider } from "@/components/advertisements/AdvertisementSlider";
import { FooterLinks } from "@/components/legal/FooterLinks";
import { TownExchangeLogo, APP_NAME } from "@/components/brand/TownExchangeLogo";
import TownLoader from "@/components/shared/TownLoader";
import AppNavbar from "@/components/shared/AppNavbar";
import { PropertyCard } from "@/components/PropertyCard";
import { getRecentSearches, addRecentSearch } from "@/lib/recentSearches";
import { getRecentlyViewedIds } from "@/lib/recentlyViewed";
import { activeTabClass, inactiveTabClass } from "@/lib/tabStyles";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8024";

const colorClasses = {
  purple: { bg: "bg-brand-50", text: "text-brand-700", hover: "hover:bg-brand-100" },
  blue: { bg: "bg-brand-50", text: "text-brand-700", hover: "hover:bg-brand-100" },
  orange: { bg: "bg-secondary-50", text: "text-secondary-700", hover: "hover:bg-secondary-100" },
  green: { bg: "bg-accent-yellow-50", text: "text-accent-yellow-700", hover: "hover:bg-accent-yellow-100" },
  red: { bg: "bg-rose-50", text: "text-rose-700", hover: "hover:bg-rose-100" },
};

const SEARCH_TABS = [
  { key: "rent", label: "For Rent", propertyFor: "Rent/Lease", category: "Rent/Lease" },
  { key: "sale", label: "For Sale", propertyFor: "Sell", category: "Buy Land/Homes" },
  { key: "commercial", label: "Commercial", propertyType: "Commercial" },
];

const QUICK_ACTIONS = [
  { icon: Building2, label: "Browse", action: "feed" },
  { icon: Heart, label: "Favourites", action: "favourites" },
  { icon: Megaphone, label: "Advertise", action: "advertise" },
  { icon: Camera, label: "Stories", action: "stories" },
];

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { selectedLocation, locationLabel } = useLocationContext();

  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(null);

  const [activeSearchTab, setActiveSearchTab] = useState(SEARCH_TABS[0].key);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [recentViewed, setRecentViewed] = useState([]);
  const [recommendationSections, setRecommendationSections] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setConfigLoading(true);
        const data = await configAPI.getLandingConfigCached();
        setConfig(data);
        setConfigError(null);
      } catch (error) {
        console.error("Failed to load configuration:", error);
        setConfigError(
          "Failed to load page configuration. Please refresh the page."
        );
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  const loadStories = useCallback(async () => {
    try {
      setStoriesLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/stories?limit=20`);
      setStories(response.data);
    } catch (error) {
      console.error("Error loading stories:", error);
      setStories([]);
    } finally {
      setStoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const searchProperties = async () => {
      if (debouncedSearchQuery.trim().length >= 2) {
        setSearching(true);
        try {
          const results = await propertyAPI.searchProperties(
            buildPropertySearchQuery(selectedLocation, debouncedSearchQuery.trim()),
            20,
            controller.signal
          );
          setSearchResults(results);
          setShowDropdown(true);
        } catch (error) {
          if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") return;
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          if (!controller.signal.aborted) setSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    };
    searchProperties();
    return () => controller.abort();
  }, [debouncedSearchQuery, selectedLocation?.id]);

  useEffect(() => {
    const ids = getRecentlyViewedIds();
    if (!ids.length) return;
    Promise.all(
      ids.slice(0, 6).map((id) =>
        propertyAPI.getPropertyById(id).catch(() => null)
      )
    ).then((results) => setRecentViewed(results.filter(Boolean)));
  }, []);

  useEffect(() => {
    if (user?.kyc_status !== "verified") {
      setRecommendationSections([]);
      return undefined;
    }
    let cancelled = false;
    setRecommendationsLoading(true);
    recommendationsAPI
      .getHome()
      .then((data) => {
        if (!cancelled) setRecommendationSections(data.sections || []);
      })
      .catch(() => {
        if (!cancelled) setRecommendationSections([]);
      })
      .finally(() => {
        if (!cancelled) setRecommendationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.kyc_status]);

  const handleCreatePost = useCallback(() => {
    setShowCreatePostModal(true);
  }, []);

  useEffect(() => {
    if (location.state?.openPost) {
      setShowCreatePostModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const handleCreatePostSuccess = useCallback(
    (propertyId) => {
      setShowCreatePostModal(false);
      if (propertyId) {
      navigate(`/property/${propertyId}`, { state: { from: '/home' } });
      }
    },
    [navigate]
  );

  const handleCategoryClick = useCallback(
    (category) => {
      navigate("/property-feed", {
        state: { category: category.categoryFilter },
      });
    },
    [navigate]
  );

  const handleViewFavourites = useCallback(() => {
    navigate(config?.favouritesSection?.actionUrl || "/favourites");
  }, [config, navigate]);

  const handleTabSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    const tab = SEARCH_TABS.find((t) => t.key === activeSearchTab);
    if (trimmed.length >= 2) {
      addRecentSearch("home", trimmed);
      if (user?.kyc_status === "verified") {
        activityAPI
          .trackSearch({
            search_query: trimmed,
            location_text: selectedLocation?.name || undefined,
            property_type: tab?.propertyType,
            transaction_type: tab?.propertyFor,
          })
          .catch(() => {});
        syncSearchAlert(
          criteriaFromFeedSearch({
            query: trimmed,
            city: getLocationCityFilter(selectedLocation),
            category: tab.category,
            propertyFor: tab.propertyFor,
            propertyType: tab.propertyType,
          }),
          trimmed
        );
      }
      navigate("/property-feed", {
        state: { query: trimmed, location: selectedLocation },
      });
      return;
    }
    if (user?.kyc_status === "verified") {
      activityAPI
        .trackSearch({
          search_query: tab.label,
          location_text: selectedLocation?.name || undefined,
          property_type: tab?.propertyType,
          transaction_type: tab?.propertyFor,
        })
        .catch(() => {});
      syncSearchAlert(
        criteriaFromFeedSearch({
          city: getLocationCityFilter(selectedLocation),
          category: tab.category,
          propertyFor: tab.propertyFor,
          propertyType: tab.propertyType,
        }),
        tab.label
      );
    }
    navigate("/property-feed", {
      state: {
        category: tab.category,
        propertyFor: tab.propertyFor,
        propertyType: tab.propertyType,
        location: selectedLocation,
      },
    });
  }, [navigate, searchQuery, activeSearchTab, selectedLocation, user?.kyc_status]);

  const handleQuickAction = useCallback(
    (action) => {
      switch (action) {
        case "feed":
          navigate("/property-feed");
          break;
        case "favourites":
          navigate("/favourites");
          break;
        case "advertise":
          navigate("/advertise/my");
          break;
        case "stories":
          document.getElementById("stories-section")?.scrollIntoView({ behavior: "smooth" });
          break;
        default:
          break;
      }
    },
    [navigate]
  );

  const handlePropertyClick = useCallback(
    (propertyId) => {
      setShowDropdown(false);
      setSearchQuery("");
      navigate(`/property/${propertyId}`, { state: { from: '/home' } });
    },
    [navigate]
  );

  const handleStoryClick = useCallback(
    (story) => {
      if (story.id) {
        navigate(`/story/${story.id}`);
      } else if (story.actionUrl) {
        navigate(story.actionUrl);
      }
    },
    [navigate]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  }, []);

  const handleStorySuccess = useCallback((newStory) => {
    setStories((prev) => [newStory, ...prev]);
    setShowStoryModal(false);
  }, []);

  const formatPrice = useCallback((price) => {
    if (!price) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const firstName = user?.name?.split(" ")[0];

  if (configLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <TownLoader size="lg" label="Loading home" minHeight="100vh" />
      </div>
    );
  }

  if (configError || !config) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Configuration Error
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {configError || "Failed to load page configuration"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 text-sm font-medium rounded-control text-white bg-brand-500 hover:bg-brand-700 shadow-soft-md transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        onSuccess={handleCreatePostSuccess}
      />

      <StoryUploadModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        onSuccess={handleStorySuccess}
      />

      <AppNavbar
        variant="home"
        showLocation
        onPostProperty={handleCreatePost}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <AdvertisementSlider />

        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-gray-900">
            {firstName ? `Hi ${firstName}` : "Find a property"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Search listings in {locationLabel}</p>
        </div>

        <div
          ref={searchRef}
          className="bg-white rounded-card border border-gray-200 shadow-soft-sm overflow-visible"
        >
          <div className="flex border-b border-gray-100">
            {SEARCH_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSearchTab(tab.key)}
                className={`flex-1 px-3 py-3 text-sm font-semibold transition-all ${
                  activeSearchTab === tab.key ? activeTabClass : inactiveTabClass
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 min-w-0">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Locality, e.g. Anna Nagar, Velachery..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={(e) => e.key === "Enter" && handleTabSearch()}
                  className="w-full pl-11 pr-10 py-3 text-sm bg-gray-50 border border-gray-200 rounded-control focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
                {searching && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <TownLoader size="xs" />
                  </div>
                )}

                {searchFocused && !searchQuery.trim() && getRecentSearches("home").length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-card shadow-soft-lg z-50 overflow-hidden">
                    <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-gray-400 border-b border-gray-100">
                      Recent searches
                    </p>
                    {getRecentSearches("home").map((term) => (
                      <button
                        key={term}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSearchQuery(term);
                          setSearchFocused(false);
                        }}
                        className="block w-full px-3 py-2.5 text-left text-sm hover:bg-brand-50"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}

                {showDropdown && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-card shadow-soft-lg max-h-80 overflow-y-auto z-50">
                    {searching ? (
                      <div className="p-4 text-center">
                        <TownLoader size="sm" label="Searching" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {searchResults.map((property) => (
                          <button
                            key={property.id}
                            onClick={() => handlePropertyClick(property.id)}
                            className="w-full px-3 py-3 hover:bg-brand-50/70 text-left transition-colors"
                          >
                            <div className="flex gap-3">
                              {property.images?.[0] ? (
                                <img
                                  src={property.images[0].url}
                                  alt=""
                                  className="w-14 h-14 rounded-control object-cover flex-shrink-0"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-control bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Home className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                  {property.bhk_type} {property.apartment_type}
                                  {property.apartment_name && ` in ${property.apartment_name}`}
                                </p>
                                <p className="text-xs text-gray-500 truncate mt-1">
                                  {property.locality}, {property.city}
                                </p>
                                <p className="text-sm font-semibold text-brand-700 mt-1">
                                  {formatPrice(property.expected_price)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm text-gray-600">
                        No properties found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleTabSearch}
                className="px-6 py-3 rounded-control text-sm font-semibold flex items-center justify-center gap-2 text-white bg-brand-500 hover:bg-brand-700 transition-colors shrink-0"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleQuickAction(item.action)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-card bg-white border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-colors"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-50 text-brand-600">
                <item.icon className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-medium text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>

        {recommendationsLoading ? (
          <div className="py-6 text-center text-sm text-gray-500">Loading recommendations...</div>
        ) : recommendationSections.filter((s) => s.properties?.length > 0).length > 0 ? (
          recommendationSections
            .filter((section) => section.properties?.length > 0)
            .map((section) => (
              <section key={section.key}>
                <h2 className="text-base font-semibold text-gray-900 mb-1">{section.title}</h2>
                {section.subtitle ? (
                  <p className="text-sm text-gray-500 mb-3">{section.subtitle}</p>
                ) : null}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {section.properties.map((property) => (
                    <div key={property.id} className="w-64 shrink-0">
                      <PropertyCard
                        property={property}
                        onOpenDetails={(propertyId) =>
                          navigate(`/property/${propertyId}`, { state: { from: "/home" } })
                        }
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))
        ) : recentViewed.length > 0 ? (
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">Recently viewed</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {recentViewed.map((property) => (
                <div key={property.id} className="w-64 shrink-0">
                  <PropertyCard
                    property={property}
                    onOpenDetails={(propertyId) =>
                      navigate(`/property/${propertyId}`, { state: { from: "/home" } })
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {config.featuredSection?.enabled && (
          <section id="stories-section">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">
                {config.featuredSection.title}
              </h2>
              {stories.length > 0 && (
                <span className="text-xs font-medium text-brand-700 px-2 py-0.5 bg-brand-50 rounded-full">
                  {stories.length}
                </span>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 snap-x scrollbar-hide">
              <button
                onClick={() => setShowStoryModal(true)}
                className="flex-shrink-0 snap-start w-20 h-28 sm:w-24 sm:h-32 rounded-card bg-white border-2 border-dashed border-brand-200 hover:border-brand-500 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center">
                  <Plus className="text-white w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-gray-700">Create</span>
              </button>

              {storiesLoading &&
                stories.length === 0 &&
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-32 rounded-card bg-gray-200 animate-pulse"
                  />
                ))}

              {stories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => handleStoryClick(story)}
                  className="flex-shrink-0 snap-start w-20 h-28 sm:w-24 sm:h-32 rounded-card overflow-hidden relative border-2 border-brand-500"
                >
                  {story.media_type === "video" ? (
                    <video
                      src={story.media_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={story.media_url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            {config.categories.title}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {config.categories.items.map((category) => {
              const colors = colorClasses[category.color] || colorClasses.purple;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className={`rounded-card bg-white border border-gray-100 hover:border-brand-300 px-3 py-4 shadow-soft-sm transition-colors w-full ${colors.hover}`}
                >
                  <div className="text-center">
                    <div className={`w-11 h-11 rounded-full ${colors.bg} flex items-center justify-center mx-auto mb-2`}>
                      <DynamicIcon name={category.icon} size={20} className={colors.text} strokeWidth={2} />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{category.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {config.favouritesSection?.enabled && user?.role === "buyer" && (
          <button
            onClick={handleViewFavourites}
            className="w-full rounded-card bg-white border border-rose-200 hover:border-rose-300 px-4 py-4 flex items-center gap-3 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
              <DynamicIcon name={config.favouritesSection.icon || "Heart"} size={20} className="text-white" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {config.favouritesSection.title}
              </p>
              <p className="text-xs text-rose-700 truncate">
                {config.favouritesSection.subtitle}
              </p>
            </div>
          </button>
        )}
      </main>

      <footer className="mt-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <TownExchangeLogo size={32} variant="full" />
            </div>
            <FooterLinks />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-500">
            <Users2 className="w-3.5 h-3.5" />
            <span>&copy; {new Date().getFullYear()} {APP_NAME}</span>
          </div>
        </div>
      </footer>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
