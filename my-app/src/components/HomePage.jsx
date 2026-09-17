import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  X,
  Home,
  AlertCircle,
  Building2,
  Megaphone,
  Users2,
} from "lucide-react";
import axios from "axios";
import { propertyAPI, activityAPI } from "../services/api";
import { configAPI } from "../services/configAPI";
import { DynamicIcon } from "./DynamicIcon";
import StoryUploadModal from "./StoryUploadModal";
import CreatePostModal from "./CreatePostModal";
import { useAuth } from "../context/AuthContext";
import { useLocationContext } from "../context/LocationContext";
import { buildPropertySearchQuery } from "@/lib/buildPropertySearchQuery";
import { getLocationCityFilter } from "@/lib/locationUtils";
import { criteriaFromFeedSearch, syncSearchAlert } from "@/lib/searchAlerts";
import { FooterLinks } from "@/components/legal/FooterLinks";
import { TownExchangeLogo, APP_NAME } from "@/components/brand/TownExchangeLogo";
import TownLoader from "@/components/shared/TownLoader";
import AppNavbar from "@/components/shared/AppNavbar";
import { PropertyCard } from "@/components/PropertyCard";
import { getRecentSearches, addRecentSearch } from "@/lib/recentSearches";
import { WithTooltip } from "@/components/ui/WithTooltip";
import { getRecentlyViewedIds } from "@/lib/recentlyViewed";
import { pickSimilarProperties } from "@/lib/homeRecommendations";
import { HomeFiltersSidebar } from "@/components/home/HomeFiltersSidebar";
import { HomeInsightsRail } from "@/components/home/HomeInsightsRail";
import { StoriesRail } from "@/components/home/StoriesRail";
import { SponsoredCarousel } from "@/components/home/SponsoredCarousel";
import { HomeTestimonials } from "@/components/home/HomeTestimonials";
import { YourListingsSection } from "@/components/home/YourListingsSection";
import { advertisementAPI } from "@/services/advertisementAPI";
import { useCompare } from "@/context/CompareContext";

import { getApiBaseUrl } from "@/lib/apiBase";

const API_BASE_URL = getApiBaseUrl();

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2400&q=80";

const SEARCH_TABS = [
  { key: "rent", label: "For Rent", propertyFor: "Rent/Lease", category: "Rent/Lease" },
  { key: "sale", label: "For Sale", propertyFor: "Sell", category: "Buy Land/Homes" },
  { key: "commercial", label: "Commercial", propertyType: "Commercial" },
];

/** Map landing-config category chips → PropertyFeed navigation state */
function categoryToFeedState(category) {
  const filter = category?.categoryFilter || category?.name || "";
  const name = (category?.name || "").toLowerCase();

  if (filter === "Rent/Lease" || name.includes("rent")) {
    return { category: "Rent/Lease", propertyFor: "Rent/Lease" };
  }
  if (
    filter === "Buy Land/Homes" ||
    name.includes("buy") ||
    name.includes("sale") ||
    name.includes("sell")
  ) {
    return { category: "Buy Land/Homes", propertyFor: "Sell" };
  }
  if (filter === "New Project" || name.includes("project")) {
    return { category: "New Project", propertyFor: "Sell" };
  }
  if (filter === "Ready To Move/Resale" || name.includes("ready")) {
    return { category: "Ready To Move/Resale", propertyFor: "Sell" };
  }
  if (filter === "Commercial" || name.includes("commercial")) {
    return { category: "All Properties", propertyType: "Commercial", propertyFor: "" };
  }
  return { category: filter || "All Properties" };
}

const QUICK_ACTIONS = [
  {
    icon: Building2,
    label: "Browse",
    action: "feed",
    /** Solid secondary — open full inventory (no rent/sale filter) */
  },
  {
    icon: Megaphone,
    label: "Advertise",
    action: "advertise",
  },
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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toggle: toggleCompare, isComparing } = useCompare();
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
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [recentlyAddedLoading, setRecentlyAddedLoading] = useState(true);
  const [recommendedForYou, setRecommendedForYou] = useState([]);
  const [recommendedSubtitle, setRecommendedSubtitle] = useState("");
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [sponsoredAds, setSponsoredAds] = useState([]);
  const [sponsoredLoading, setSponsoredLoading] = useState(true);
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

  useEffect(() => {
    let cancelled = false;
    setStoriesLoading(true);

    (async () => {
      try {
        const { data: storyData } = await axios.get(`${API_BASE_URL}/api/stories?limit=20`, {
          timeout: 15_000,
          withCredentials: true,
        });
        if (cancelled) return;
        setStories(Array.isArray(storyData) ? storyData : []);
      } catch (err) {
        console.error("Stories load failed:", err);
        if (!cancelled) setStories([]);
      } finally {
        if (!cancelled) setStoriesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
    let cancelled = false;
    setRecentlyAddedLoading(true);
    const city = getLocationCityFilter(selectedLocation);
    propertyAPI
      .getProperties({ limit: 12, ...(city ? { city } : {}) })
      .then((data) => {
        if (!cancelled) setRecentlyAdded(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setRecentlyAdded([]);
      })
      .finally(() => {
        if (!cancelled) setRecentlyAddedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedLocation?.id]);

  useEffect(() => {
    let cancelled = false;
    setRecommendationsLoading(true);
    const city = getLocationCityFilter(selectedLocation);
    const exclude = new Set(recentlyAdded.slice(0, 6).map((p) => p.id));

    (async () => {
      try {
        const viewedIds = getRecentlyViewedIds();
        let seed = recentViewed[0] || null;
        if (!seed && viewedIds[0]) {
          seed = await propertyAPI.getPropertyById(viewedIds[0]).catch(() => null);
        }

        const poolParams = {
          limit: 40,
          ...(city ? { city } : {}),
          ...(seed?.city && !city ? { city: seed.city } : {}),
          ...(seed?.bhk_type ? { bhk_type: seed.bhk_type } : {}),
        };
        const poolRaw = await propertyAPI.getProperties(poolParams);
        const pool = Array.isArray(poolRaw) ? poolRaw : [];
        let picks = pickSimilarProperties(pool, seed, exclude, 6);

        // If similarity is thin (small catalog), widen without repeating Recently added row
        if (picks.length < 2) {
          const wide = await propertyAPI.getProperties({
            limit: 40,
            ...(city ? { city } : {}),
          });
          const wideList = Array.isArray(wide) ? wide : [];
          picks = pickSimilarProperties(wideList, seed, exclude, 6);
          if (picks.length < 2) {
            picks = wideList.filter((p) => !exclude.has(p.id) && p.id !== seed?.id).slice(0, 6);
          }
        }

        if (cancelled) return;
        setRecommendedForYou(picks);
        if (seed && user?.name) {
          const first = user.name.split(" ")[0];
          setRecommendedSubtitle(
            `Similar to homes ${first} viewed${seed.locality ? ` near ${seed.locality}` : ""}`
          );
        } else if (seed?.locality) {
          setRecommendedSubtitle(`Similar to homes you viewed near ${seed.locality}`);
        } else if (picks.length) {
          setRecommendedSubtitle("Picks matched to browsing on Town-X");
        } else {
          setRecommendedSubtitle("");
        }
      } catch {
        if (!cancelled) {
          setRecommendedForYou([]);
          setRecommendedSubtitle("");
        }
      } finally {
        if (!cancelled) setRecommendationsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedLocation?.id, recentlyAdded, recentViewed, user?.name]);

  useEffect(() => {
    let cancelled = false;
    setSponsoredLoading(true);

    (async () => {
      try {
        const ads = await advertisementAPI.getSlider().catch(() => []);
        if (cancelled) return;
        setSponsoredAds(Array.isArray(ads) ? ads.slice(0, 8) : []);
      } catch {
        if (!cancelled) setSponsoredAds([]);
      } finally {
        if (!cancelled) setSponsoredLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreatePost = useCallback(() => {
    setShowCreatePostModal(true);
  }, []);

  useEffect(() => {
    if (location.state?.openPost && user?.role === "owner") {
      setShowCreatePostModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate, user?.role]);

  const handleCreatePostSuccess = useCallback(() => {
    setShowCreatePostModal(false);
    queryClient.invalidateQueries({ queryKey: ["my-properties"] });
  }, [queryClient]);

  const handleCategoryClick = useCallback(
    (category) => {
      const feed = categoryToFeedState(category);
      navigate("/property-feed", {
        state: {
          ...feed,
          location: selectedLocation,
          from: "/home",
        },
      });
    },
    [navigate, selectedLocation]
  );

  const handleQuickAction = useCallback(
    (action) => {
      switch (action) {
        case "feed":
          navigate("/property-feed", {
            state: {
              category: "All Properties",
              propertyFor: "",
              propertyType: "",
              resetFilters: true,
              location: selectedLocation,
              from: "/home",
            },
          });
          break;
        case "advertise":
          navigate("/advertise/submit", { state: { from: "/home" } });
          break;
        default:
          break;
      }
    },
    [navigate, selectedLocation]
  );

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
      if (story?.id) navigate(`/story/${story.id}`);
    },
    [navigate]
  );

  const handleStorySuccess = useCallback((newStory) => {
    setStories((prev) => [newStory, ...prev]);
    setShowStoryModal(false);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
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
  const heroImageUrl =
    recentlyAdded.find((p) => p.images?.[0]?.url)?.images?.[0]?.url || HERO_IMAGE;

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
    <div className="min-h-screen bg-[#f3f5f7] overflow-x-hidden">
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
        maxWidth="full"
        onPostProperty={handleCreatePost}
      />

      {/* Compact full-bleed hero + search */}
      <section className="relative isolate w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImageUrl}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-[#f3f5f7]" />
        </div>

        <div className="relative mx-auto flex min-h-[min(38vh,320px)] max-w-[44rem] flex-col items-center justify-center px-4 pb-8 pt-8 text-center sm:min-h-[min(34vh,300px)] sm:pb-10 sm:pt-9">
          <TownExchangeLogo size={40} variant="full" className="mb-2 brightness-0 invert sm:mb-2.5" />
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {APP_NAME}
          </h1>
          <p className="mt-1.5 max-w-lg text-xs text-white/85 sm:text-sm">
            {firstName
              ? `Hi ${firstName} — find homes across ${locationLabel}.`
              : `Homes for rent and sale across ${locationLabel}.`}
          </p>

          <div
            ref={searchRef}
            className="mt-4 w-full overflow-visible rounded-card bg-white/95 shadow-soft-lg backdrop-blur-sm sm:mt-5"
          >
            <div className="flex border-b border-gray-100">
              {SEARCH_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveSearchTab(tab.key)}
                  className={`flex-1 px-2 py-2 text-xs font-semibold transition-colors sm:px-3 sm:py-2.5 sm:text-sm ${
                    activeSearchTab === tab.key
                      ? "border-b-2 border-brand-500 bg-brand-50/80 text-brand-800"
                      : "border-b-2 border-transparent text-gray-600 hover:bg-gray-50 hover:text-brand-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-2.5 sm:p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Locality, e.g. Anna Nagar, Velachery..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                    onKeyDown={(e) => e.key === "Enter" && handleTabSearch()}
                    className="w-full rounded-control border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  {searchQuery ? (
                    <WithTooltip label="Clear search">
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                      >
                        <X size={16} />
                      </button>
                    </WithTooltip>
                  ) : null}
                  {searching ? (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      <TownLoader size="xs" />
                    </div>
                  ) : null}

                  {searchFocused && !searchQuery.trim() && getRecentSearches("home").length > 0 ? (
                    <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-card border border-gray-200 bg-white shadow-soft-lg">
                      <p className="border-b border-gray-100 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">
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
                  ) : null}

                  {showDropdown ? (
                    <div className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-card border border-gray-200 bg-white shadow-soft-lg">
                      {searching ? (
                        <div className="p-4 text-center">
                          <TownLoader size="sm" label="Searching" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {searchResults.map((property) => (
                            <button
                              key={property.id}
                              type="button"
                              onClick={() => handlePropertyClick(property.id)}
                              className="w-full px-3 py-3 text-left transition-colors hover:bg-brand-50/70"
                            >
                              <div className="flex gap-3">
                                {property.images?.[0] ? (
                                  <img
                                    src={property.images[0].url}
                                    alt=""
                                    className="h-14 w-14 flex-shrink-0 rounded-control object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-control bg-gray-100">
                                    <Home className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-gray-900">
                                    {property.bhk_type} {property.apartment_type}
                                    {property.apartment_name && ` in ${property.apartment_name}`}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-gray-500">
                                    {property.locality}, {property.city}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-brand-700">
                                    {formatPrice(property.expected_price)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-sm text-gray-600">No properties found</div>
                      )}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={handleTabSearch}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-control bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destination chips under hero */}
      <div className="border-b border-gray-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[90rem] items-center gap-1.5 overflow-x-auto px-3 sm:px-4 py-2 scrollbar-hide">
          {config.categories?.items?.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
            >
              <DynamicIcon name={category.icon} size={13} className="text-brand-600" strokeWidth={2} />
              {category.name}
            </button>
          ))}
          {QUICK_ACTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleQuickAction(item.action)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
            >
              <item.icon className="size-3 text-brand-600" strokeWidth={2} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stories only — listings live in Recently added / recommendations below */}
      <StoriesRail
        stories={stories}
        loading={storiesLoading}
        onOpenStory={handleStoryClick}
        onCreateStory={() => setShowStoryModal(true)}
      />

      {/* 3-column band: filters | main | insights */}
      <div className="mx-auto max-w-[90rem] px-4 py-6 lg:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className="hidden min-w-0 lg:col-span-3 lg:block xl:col-span-2">
            <HomeFiltersSidebar
              defaultPropertyFor={
                SEARCH_TABS.find((t) => t.key === activeSearchTab)?.propertyFor || ""
              }
            />
          </div>

          <div className="min-w-0 overflow-hidden space-y-8 lg:col-span-6 xl:col-span-7">
            {/* Mobile filters entry */}
            <details className="rounded-card border border-gray-200 bg-white lg:hidden">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-900">
                Filters
              </summary>
              <div className="border-t border-gray-100 px-4 pb-4 pt-2">
                <HomeFiltersSidebar
                  defaultPropertyFor={
                    SEARCH_TABS.find((t) => t.key === activeSearchTab)?.propertyFor || ""
                  }
                />
              </div>
            </details>

            {user?.role === "owner" ? (
              <YourListingsSection onPostProperty={handleCreatePost} />
            ) : user?.role === "buyer" ? (
              <button
                type="button"
                onClick={() => navigate("/property-feed")}
                className="flex w-full items-center gap-3 border border-brand-200 bg-brand-50/70 px-4 py-3.5 text-left transition-colors hover:bg-brand-50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                  <Search className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">Find your next home</span>
                  <span className="mt-0.5 block text-xs text-brand-800">
                    Browse listings, save favourites, and contact owners directly.
                  </span>
                </span>
              </button>
            ) : null}

            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-gray-900">
                    Recently added
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">Fresh listings across {locationLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/property-feed")}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  See all
                </button>
              </div>

              {recentlyAddedLoading ? (
                <div className="py-10 text-center text-sm text-gray-500">Loading listings…</div>
              ) : recentlyAdded.length > 0 ? (
                <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide">
                  {recentlyAdded.slice(0, 6).map((property) => (
                    <div
                      key={property.id}
                      className="w-[min(72vw,260px)] max-w-[260px] shrink-0"
                    >
                      <PropertyCard
                        property={property}
                        className="w-full"
                        onOpenDetails={(propertyId) =>
                          navigate(`/property/${propertyId}`, { state: { from: "/home" } })
                        }
                        onCompareToggle={toggleCompare}
                        isComparing={isComparing(property.id)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-sm text-gray-500">No listings yet in this area.</p>
              )}
            </section>

            {recommendationsLoading ? (
              <div className="py-6 text-center text-sm text-gray-500">Loading recommendations…</div>
            ) : recommendedForYou.length > 0 ? (
              <section className="min-w-0">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-gray-900">
                      Recommended for you
                    </h2>
                    {recommendedSubtitle ? (
                      <p className="mt-0.5 text-sm text-gray-500">{recommendedSubtitle}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/property-feed")}
                    className="text-sm font-medium text-brand-700 hover:underline"
                  >
                    See all
                  </button>
                </div>
                <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide">
                  {recommendedForYou.map((property) => (
                    <div
                      key={property.id}
                      className="w-[min(72vw,260px)] max-w-[260px] shrink-0"
                    >
                      <PropertyCard
                        property={property}
                        className="w-full"
                        onOpenDetails={(propertyId) =>
                          navigate(`/property/${propertyId}`, { state: { from: "/home" } })
                        }
                        onCompareToggle={toggleCompare}
                        isComparing={isComparing(property.id)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <SponsoredCarousel ads={sponsoredAds} loading={sponsoredLoading} />

            {/* Mobile insights */}
            <div className="lg:hidden">
              <HomeInsightsRail />
            </div>
          </div>

          <div className="hidden min-w-0 lg:col-span-3 lg:block">
            <HomeInsightsRail />
          </div>
        </div>
      </div>

      <HomeTestimonials />

      <footer className="mt-0 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-[90rem] px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <TownExchangeLogo size={32} variant="full" />
            </div>
            <FooterLinks />
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-gray-100 pt-4 text-xs text-gray-500">
            <Users2 className="h-3.5 w-3.5" />
            <span>
              &copy; {new Date().getFullYear()} {APP_NAME}
            </span>
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

