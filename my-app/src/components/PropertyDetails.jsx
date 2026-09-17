import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Heart, Phone, Mail, MapPin, Home,
  Bed, Bath, Square, Car, Building2,
  ChevronLeft, ChevronRight, User, Shield, Clock, X, Flag,
  Share2, BadgeCheck, Maximize2
} from 'lucide-react';
import { propertyAPI, enquiryAPI, reportAPI } from '../services/api';
import { useAuth } from '@/context/AuthContext';
import PropertyDetailsSkeleton from "@/components/shared/PropertyDetailsSkeleton";
import { recordRecentlyViewed } from "@/lib/recentlyViewed";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { formatPricePerSqft } from "@/lib/finance";
import { EMICalculator } from './EMICalculator';
import { getApiErrorMessage } from '@/lib/apiErrors';
import LoadErrorState from "@/components/shared/LoadErrorState";
import AppNavbar from "@/components/shared/AppNavbar";
import { WithTooltip } from "@/components/ui/WithTooltip";
import { useToast } from "@/components/ui/toast";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { MarkdownContent } from "@/components/shared/MarkdownContent";
import { PropertyLocalityMap } from "@/components/property/PropertyLocalityMap";
import { SimilarPropertiesRail } from "@/components/property/SimilarPropertiesRail";
import { AmenityIconGrid } from "@/components/property/AmenityIconGrid";
import { Dropdown } from "@/components/ui/dropdown";

const REPORT_REASONS = [
  { value: "Misleading listing", label: "Misleading listing" },
  { value: "Duplicate listing", label: "Duplicate listing" },
  { value: "Wrong location or price", label: "Wrong location or price" },
  { value: "Suspected fraud", label: "Suspected fraud" },
  { value: "Other", label: "Other" },
];

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from || '/home';
  const { user } = useAuth();
  const { toast } = useToast();
  const homeRoute = user ? (user.role === 'owner' ? '/owner/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/home') : '/home';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCause, setErrorCause] = useState(null);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryError, setEnquiryError] = useState(null);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [showMobileEnquiry, setShowMobileEnquiry] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const reportModalRef = useFocusTrap(showReportModal, () => setShowReportModal(false));
  const [reportReason, setReportReason] = useState('Misleading listing');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!showImageModal) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showImageModal]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    setError(null);
    setErrorCause(null);
    try {
      const data = await propertyAPI.getPropertyById(id);
      setProperty(data);
      recordRecentlyViewed(Number(id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load this property. Please try again.'));
      setErrorCause(err);
      console.error('Error loading property:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
    }
  };

  const handleNextImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === property.images.length - 1 ? 0 : prev + 1));
    }
  };

  const handleToggleFavourite = async () => {
    try {
      const result = await propertyAPI.toggleFavourite(property.id);
      setProperty(prev => ({
        ...prev,
        is_favourite: result.is_favourite
      }));
    } catch (err) {
      console.error('Error toggling favourite:', err);
      toast(getApiErrorMessage(err, 'Failed to update favourite. Please try again.'), 'error');
    }
  };

  const canEnquire = user?.kyc_status === 'verified' && property?.status === 'PUBLISHED';

  const handleSubmitEnquiry = async () => {
    if (!canEnquire) {
      navigate('/login', { state: { from: `/property/${id}` } });
      return;
    }
    if (enquiryMessage.trim().length < 5) {
      setEnquiryError('Please enter a message of at least 5 characters.');
      setShowMobileEnquiry(true);
      return;
    }
    setEnquirySubmitting(true);
    setEnquiryError(null);
    try {
      await enquiryAPI.create({
        property_id: Number(id),
        message: enquiryMessage.trim(),
        contact_method: 'phone',
      });
      setEnquirySuccess(true);
      setEnquiryMessage('');
      setShowMobileEnquiry(false);
    } catch (err) {
      setEnquiryError(getApiErrorMessage(err, 'Could not send enquiry. Please try again.'));
      setShowMobileEnquiry(true);
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const handleSubmitReport = async () => {
    if (user?.kyc_status !== 'verified') {
      navigate('/login', { state: { from: `/property/${id}` } });
      return;
    }
    setReportSubmitting(true);
    setReportError(null);
    try {
      await reportAPI.reportProperty({
        property_id: Number(id),
        reason: reportReason,
        description: reportDetails.trim() || undefined,
      });
      setReportSuccess(true);
      setShowReportModal(false);
    } catch (err) {
      setReportError(getApiErrorMessage(err, 'Could not submit report.'));
    } finally {
      setReportSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Price not available';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = property
      ? `${property.bhk_type || property.apartment_type || 'Property'} in ${property.locality || property.city || 'Town-X'}`
      : 'Town-X property';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url, text: title });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard', 'success');
    } catch (err) {
      if (err?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        toast('Link copied to clipboard', 'success');
      } catch {
        toast('Could not share this listing', 'error');
      }
    }
  };

  const openMobileEnquiry = (preset) => {
    if (!canEnquire) {
      navigate('/login', { state: { from: `/property/${id}` } });
      return;
    }
    if (preset) setEnquiryMessage(preset);
    setEnquiryError(null);
    setShowMobileEnquiry(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNavbar variant="inner" backTo={backTo} maxWidth="7xl" logoTagline="Property Details" />
        <PropertyDetailsSkeleton />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNavbar variant="inner" backTo={backTo} maxWidth="7xl" logoTagline="Property Details" />
        <div className="flex items-center justify-center p-4 min-h-[60vh]">
          {error ? (
            <LoadErrorState
              title="Couldn't load property"
              message={error}
              error={errorCause}
              onRetry={fetchPropertyDetails}
            />
          ) : (
            <div className="text-center">
              <p className="text-gray-700 text-base font-medium mb-3">Property not found</p>
              <button
                onClick={() => navigate(backTo)}
                className="px-6 py-2.5 bg-brand-500 text-white rounded-control hover:bg-brand-700 font-medium text-sm transition-colors"
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isCommercial = property.property_type === "Commercial";
  const commercialLabel =
    property.commercial_subtype || property.apartment_type || "Commercial";
  const imageAlt = isCommercial
    ? `${commercialLabel} in ${property.locality}, ${property.city}`
    : `${property.bhk_type} ${property.apartment_type} in ${property.locality}, ${property.city}`;
  const pricePerSqftLabel = formatPricePerSqft(
    property.expected_price,
    property.carpet_area,
    property.built_up_area
  );
  const hasMapCoords =
    typeof property.latitude === "number" &&
    typeof property.longitude === "number" &&
    !Number.isNaN(property.latitude) &&
    !Number.isNaN(property.longitude);
  const ownerLabel = property.user_type || "Owner";
  const overviewTileClass =
    "text-center p-3 md:p-4 bg-gray-50 rounded-control border border-transparent hover:border-gray-200 transition-colors";

  const detailRow = (label, value, { last } = {}) => {
    if (value == null || value === "") return null;
    return (
      <div
        key={label}
        className={`flex justify-between gap-3 py-2.5 px-2 ${last ? "" : "border-b border-gray-100"}`}
      >
        <span className="text-gray-600 text-sm md:text-base shrink-0">{label}</span>
        <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">
          {value}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar
        variant="inner"
        backTo={backTo}
        maxWidth="7xl"
        logoTagline="Property Details"
        extraActions={
          property ? (
            <WithTooltip
              label={property.is_favourite ? "Remove from favourites" : "Save to favourites"}
            >
              <button
                type="button"
                onClick={handleToggleFavourite}
                className="inline-flex shrink-0 items-center justify-center p-1.5 sm:p-2 hover:bg-gray-100 rounded-control transition-colors"
                aria-label={property.is_favourite ? "Remove from favourites" : "Add to favourites"}
              >
                <Heart
                  size={20}
                  className={property.is_favourite ? 'fill-red-500 text-red-500' : 'text-gray-700'}
                />
              </button>
            </WithTooltip>
          ) : null
        }
      />

      {/* Breadcrumbs - Desktop Only */}
      <div className="hidden md:block bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigate(homeRoute)}
              className="flex items-center gap-1.5 text-gray-600 hover:text-brand-600 transition-colors group"
            >
              <Home size={16} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Home</span>
            </button>
            <ChevronRight size={16} className="text-gray-400" />
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-brand-600 transition-colors font-medium"
            >
              Properties
            </button>
            <ChevronRight size={16} className="text-gray-400" />
            <span className="text-brand-600 font-semibold truncate max-w-xs">
              {isCommercial
                ? `${commercialLabel} in ${property.locality || "Location"}`
                : `${property.bhk_type || "Property"} in ${property.locality || "Location"}`}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto">
            {/* Image Gallery */}
        <div className="relative bg-black overflow-hidden">
          <div className="relative mx-auto aspect-[16/10] w-full max-h-[min(70vh,560px)] overflow-hidden">
            <img
              src={property.images && property.images.length > 0 && property.images[currentImageIndex]?.url
                ? property.images[currentImageIndex].url
                : 'https://via.placeholder.com/800x600?text=No+Image'}
              alt={imageAlt}
              className="h-full w-full max-h-[min(70vh,560px)] object-cover cursor-pointer"
              onClick={() => setShowImageModal(true)}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

            {property.images && property.images.length > 1 && (
              <>
                <WithTooltip label="Previous image" side="right">
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                    className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2.5 md:p-3 rounded-full hover:bg-black/80 transition-colors shadow-soft-md"
                  >
                    <ChevronLeft size={24} />
                  </button>
                </WithTooltip>
                <WithTooltip label="Next image" side="left">
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Next image"
                    className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2.5 md:p-3 rounded-full hover:bg-black/80 transition-colors shadow-soft-md"
                  >
                    <ChevronRight size={24} />
                  </button>
                </WithTooltip>
              </>
            )}

            {property.images && property.images.length > 0 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <WithTooltip label="Open fullscreen gallery">
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="bg-black/70 text-white p-2 rounded-full hover:bg-black/85 transition-colors"
                    aria-label="Open fullscreen gallery"
                  >
                    <Maximize2 size={16} />
                  </button>
                </WithTooltip>
                <div className="bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {property.images.length}
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {property.images && property.images.length > 0 && (
            <div className="flex gap-2 md:gap-3 p-3 md:p-4 overflow-x-auto scrollbar-hide bg-gray-900">
              {property.images.map((img, index) => (
                <WithTooltip key={index} label={`View image ${index + 1}`}>
                  <button
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`View image ${index + 1} of ${property.images.length}`}
                    aria-current={currentImageIndex === index ? "true" : undefined}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-control overflow-hidden border-2 transition-all ${
                      currentImageIndex === index ? 'border-brand-500 scale-105 shadow-soft-md' : 'border-transparent opacity-60 hover:opacity-80'
                    }`}
                  >
                    <img src={img.url} alt={`${imageAlt} — photo ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                </WithTooltip>
              ))}
            </div>
          )}
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="lg:flex lg:items-start lg:gap-6 lg:px-6 lg:py-6">

          {/* Left Column - Main Details */}
          <div className="lg:flex-1 min-w-0 px-4 lg:px-0 py-4 space-y-5 pb-28 lg:pb-6">

            {/* Price & Title */}
            <div className="bg-gradient-to-br from-white to-brand-50/40 rounded-card shadow-brand-glow border border-brand-100 p-5 md:p-6">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                    {isCommercial
                      ? `${commercialLabel}${property.apartment_name ? ` · ${property.apartment_name}` : ""}`
                      : `${property.bhk_type || "Property"} ${property.apartment_type || ""}${
                          property.apartment_name ? ` in ${property.apartment_name}` : ""
                        }`}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-2">
                    {property.created_at ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={14} />
                        {formatRelativeTime(property.created_at)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-sm md:text-base text-gray-600 mt-2">
                    <MapPin size={18} className="flex-shrink-0 text-brand-600" />
                    <span>{property.locality || 'Location'}, {property.city || 'City'}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <WithTooltip label={property.is_favourite ? "Remove from favourites" : "Save"}>
                    <button
                      type="button"
                      onClick={handleToggleFavourite}
                      className="inline-flex size-10 items-center justify-center rounded-control border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      aria-label={property.is_favourite ? "Remove from favourites" : "Save to favourites"}
                    >
                      <Heart
                        size={18}
                        className={property.is_favourite ? "fill-red-500 text-red-500" : ""}
                      />
                    </button>
                  </WithTooltip>
                  <WithTooltip label="Share listing">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex size-10 items-center justify-center rounded-control border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      aria-label="Share listing"
                    >
                      <Share2 size={18} />
                    </button>
                  </WithTooltip>
                </div>
              </div>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                <p className="text-3xl md:text-4xl font-bold text-brand-600">
                  {formatPrice(property.expected_price)}
                </p>
                {property.property_for === 'Rent/Lease' && (
                  <span className="text-gray-500 text-base">/month</span>
                )}
                {pricePerSqftLabel && property.property_for !== 'Rent/Lease' ? (
                  <span className="text-base font-semibold text-gray-600">{pricePerSqftLabel}</span>
                ) : null}
              </div>

              {property.property_for === 'Rent/Lease' && (
                <div className="flex flex-wrap gap-4 text-sm md:text-base mb-3">
                  {Number(property.security_deposit) > 0 && (
                    <div>
                      <span className="text-gray-600">Security: </span>
                      <span className="font-semibold text-gray-800">{formatPrice(property.security_deposit)}</span>
                    </div>
                  )}
                  {Number(property.maintenance_charges) > 0 && (
                    <div>
                      <span className="text-gray-600">Maintenance: </span>
                      <span className="font-semibold text-gray-800">{formatPrice(property.maintenance_charges)}/mo</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-brand-100">
                <span className={`px-3.5 py-1.5 rounded-full text-sm font-semibold ${
                  property.property_for === 'Sell'
                    ? 'bg-brand-50 text-brand-800 border border-brand-200'
                    : 'bg-teal-50 text-teal-800 border border-teal-200'
                }`}>
                  {property.property_for === 'Sell' ? 'For Sale' : `For ${property.property_for || 'N/A'}`}
                </span>
                {isCommercial ? (
                  <span className="px-3.5 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    {commercialLabel}
                  </span>
                ) : (
                  <>
                    {property.apartment_type && (
                      <span className="px-3.5 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        {property.apartment_type}
                      </span>
                    )}
                    {property.bhk_type && (
                      <span className="px-3.5 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        {property.bhk_type}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Trust bar */}
            <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                  <User size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{ownerLabel}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <BadgeCheck size={12} />
                      Verified {ownerLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-700 border border-gray-200">
                      <Phone size={11} /> Phone verified
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-700 border border-gray-200">
                      <Shield size={11} /> ID verified
                    </span>
                    {property.verification_tier ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-700 border border-gray-200 capitalize">
                        <BadgeCheck size={11} /> {String(property.verification_tier).replace(/_/g, " ")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 inline-flex items-center gap-1">
                    <Clock size={12} /> Usually responds within a few hours
                  </p>
                </div>
              </div>
            </div>

            {/* Property Overview */}
            <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-5 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Property Overview</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {!isCommercial && property.bhk_type && property.bhk_type.split(' ')[0] !== 'Studio' && (
                  <div className={overviewTileClass}>
                    <Bed className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Bedrooms</p>
                    <p className="font-bold text-gray-900 text-base">{property.bhk_type.split(' ')[0]}</p>
                  </div>
                )}
                {!isCommercial && property.bathrooms !== undefined && property.bathrooms > 0 && (
                  <div className={overviewTileClass}>
                    <Bath className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Bathrooms</p>
                    <p className="font-bold text-gray-900 text-base">{property.bathrooms}</p>
                  </div>
                )}
                {isCommercial && (property.washroom_count > 0 || property.bathrooms > 0) && (
                  <div className={overviewTileClass}>
                    <Bath className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Washrooms</p>
                    <p className="font-bold text-gray-900 text-base">
                      {property.washroom_count ?? property.bathrooms}
                    </p>
                  </div>
                )}
                {Number(property.carpet_area) > 0 && (
                  <div className={overviewTileClass}>
                    <Square className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">{isCommercial ? "Area" : "Carpet Area"}</p>
                    <p className="font-bold text-gray-900 text-base">{property.carpet_area} sqft</p>
                  </div>
                )}
                {isCommercial && property.frontage_ft ? (
                  <div className={overviewTileClass}>
                    <Building2 className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Frontage</p>
                    <p className="font-bold text-gray-900 text-base">{property.frontage_ft} ft</p>
                  </div>
                ) : null}
                {!isCommercial && property.balconies !== undefined && property.balconies > 0 && (
                  <div className={overviewTileClass}>
                    <Home className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Balconies</p>
                    <p className="font-bold text-gray-900 text-base">{property.balconies}</p>
                  </div>
                )}
                {property.parking !== undefined && property.parking > 0 && (
                  <div className={overviewTileClass}>
                    <Car className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Parking</p>
                    <p className="font-bold text-gray-900 text-base">{property.parking}</p>
                  </div>
                )}
                {(property.floor_number != null || property.floor != null) && (
                  <div className={overviewTileClass}>
                    <Building2 className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Floor</p>
                    <p className="font-bold text-gray-900 text-base">
                      {isCommercial
                        ? (property.floor_number ?? property.floor)
                        : `${property.floor}/${property.total_floors}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Property Details — grouped */}
            <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-5 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Property Details</h3>

              <div className="space-y-5">
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Space</h4>
                  <div>
                    {detailRow("Property Type", isCommercial ? `Commercial · ${commercialLabel}` : property.property_type)}
                    {detailRow(
                      isCommercial ? "Building name" : "Apartment Name",
                      property.apartment_name
                    )}
                    {detailRow(
                      isCommercial ? "Area" : "Carpet Area",
                      property.carpet_area > 0 ? `${property.carpet_area} sq.ft` : null
                    )}
                    {detailRow(
                      "Built-up Area",
                      property.built_up_area > 0 ? `${property.built_up_area} sq.ft` : null
                    )}
                    {!isCommercial &&
                      detailRow(
                        "Bathrooms",
                        property.bathrooms > 0 ? property.bathrooms : null
                      )}
                    {isCommercial &&
                      detailRow(
                        "Washrooms",
                        (property.washroom_count ?? property.bathrooms) > 0
                          ? (property.washroom_count ?? property.bathrooms)
                          : null
                      )}
                    {!isCommercial &&
                      detailRow(
                        "Balconies",
                        property.balconies > 0 ? property.balconies : null
                      )}
                    {detailRow(
                      "Floor",
                      isCommercial
                        ? (property.floor_number ?? property.floor)
                        : property.floor != null && property.total_floors
                          ? `${property.floor} of ${property.total_floors}`
                          : null,
                      { last: true }
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Building</h4>
                  <div>
                    {isCommercial &&
                      detailRow(
                        "Frontage",
                        property.frontage_ft ? `${property.frontage_ft} ft` : null
                      )}
                    {detailRow("Property Age", property.property_age)}
                    {!isCommercial && detailRow("Furnishing Status", property.furnishing_status)}
                    {detailRow(
                      "Parking",
                      property.parking > 0 ? property.parking : null,
                      { last: true }
                    )}
                  </div>
                </div>

                {property.available_from ? (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Availability</h4>
                    <div>
                      {detailRow(
                        "Available From",
                        new Date(property.available_from).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }),
                        { last: true }
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Amenities */}
            {property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0 && (
              <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-5 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Amenities</h3>
                <AmenityIconGrid amenities={property.amenities} />
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-5 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-3">Property Description</h3>
                <MarkdownContent content={property.description} className="text-gray-700" />
              </div>
            )}

            {/* Location — real map when coords exist; no "coming soon" */}
            {(property.address || hasMapCoords) && (
              <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-5 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Location</h3>
                {property.address ? (
                  <div className="flex items-start gap-2.5 mb-4 p-3 bg-gray-50 rounded-control">
                    <MapPin size={20} className="text-brand-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base text-gray-700">{property.address}</p>
                  </div>
                ) : null}
                {hasMapCoords ? (
                  <PropertyLocalityMap
                    latitude={property.latitude}
                    longitude={property.longitude}
                    locality={property.locality}
                    city={property.city}
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    Approximate map unavailable for this listing. Locality:{" "}
                    <span className="font-medium text-gray-700">
                      {[property.locality, property.city].filter(Boolean).join(", ")}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* EMI — after property facts, as decision support */}
            {property.property_for !== 'Rent/Lease' && (
              <EMICalculator propertyPrice={property.expected_price} />
            )}
          </div>

          {/* Right Column - Sticky Contact Card (Desktop) */}
          <div className="hidden lg:block lg:w-96 lg:shrink-0 lg:self-start">
            <div className="sticky top-24 bg-white rounded-card shadow-soft-lg border border-gray-100 p-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Contact Owner</h3>

              <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                  <User size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-gray-900">{ownerLabel}</span>
                    <BadgeCheck size={16} className="text-emerald-500" />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      Phone verified
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      ID verified
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500 inline-flex items-center gap-1">
                    <Clock size={12} /> Usually responds within a few hours
                  </p>
                  <p className="mt-1 text-xs text-gray-400">Listed {formatDate(property.created_at)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-brand-50 p-4 rounded-control border border-brand-200">
                  <p className="text-xs text-brand-800 mb-1 font-medium">Send an enquiry</p>
                  <p className="text-sm text-brand-700">
                    {canEnquire
                      ? 'The owner will be notified of your interest.'
                      : user
                        ? 'Complete KYC verification to contact owners.'
                        : 'Sign in and verify your account to send an enquiry.'}
                  </p>
                </div>

                <textarea
                  value={enquiryMessage}
                  onChange={(e) => setEnquiryMessage(e.target.value)}
                  rows={3}
                  placeholder="Hi, I'm interested in this property. Please share more details..."
                  disabled={!canEnquire || enquirySubmitting}
                  className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:bg-gray-50"
                />
                {enquiryError ? <p className="text-xs text-red-600">{enquiryError}</p> : null}
                {enquirySuccess ? (
                  <p className="text-xs text-emerald-700">
                    Enquiry sent!{' '}
                    <button
                      type="button"
                      className="font-medium underline"
                      onClick={() => navigate('/enquiries')}
                    >
                      View my enquiries
                    </button>
                  </p>
                ) : null}
                <button
                  onClick={handleSubmitEnquiry}
                  disabled={!canEnquire || enquirySubmitting}
                  className="w-full py-3 px-4 rounded-control text-white font-semibold text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-soft-md hover:shadow-brand-glow bg-brand-500 hover:bg-brand-700 disabled:opacity-60 disabled:hover:scale-100"
                >
                  <Mail size={18} />
                  {enquirySubmitting ? 'Sending...' : 'Send enquiry'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="w-full py-2 px-4 rounded-control border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Flag size={16} />
                  Report listing
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  For safety, don't transfer money before viewing the property
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-6 pb-28 lg:pb-10">
          <SimilarPropertiesRail property={property} />
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-soft-lg z-30 safe-bottom">
        {showMobileEnquiry ? (
          <div className="space-y-2">
            <textarea
              value={enquiryMessage}
              onChange={(e) => setEnquiryMessage(e.target.value)}
              rows={3}
              placeholder="Hi, I'm interested in this property. Please share more details..."
              disabled={!canEnquire || enquirySubmitting}
              className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:bg-gray-50"
              aria-label="Enquiry message"
            />
            {enquiryError ? <p className="text-xs text-red-600">{enquiryError}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowMobileEnquiry(false)}
                className="px-3 py-3 rounded-control border border-gray-200 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitEnquiry}
                disabled={!canEnquire || enquirySubmitting}
                className="flex-1 py-3 px-4 rounded-control text-white font-semibold text-sm flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-60"
              >
                <Mail size={18} />
                {enquirySubmitting ? 'Sending...' : 'Send enquiry'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                openMobileEnquiry(
                  "Please call me about this property. I'm interested and would like to discuss details."
                )
              }
              disabled={enquirySubmitting}
              className="flex-1 py-3 px-4 rounded-control border border-brand-200 text-brand-700 font-semibold text-sm flex items-center justify-center gap-2 bg-brand-50 hover:bg-brand-100 disabled:opacity-60"
            >
              <Phone size={18} />
              Call
            </button>
            <button
              type="button"
              onClick={() => openMobileEnquiry()}
              disabled={enquirySubmitting}
              className="flex-[1.4] py-3 px-4 rounded-control text-white font-semibold text-sm flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-60"
            >
              <Mail size={18} />
              {enquirySuccess ? 'Enquire again' : 'Enquire'}
            </button>
          </div>
        )}
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div
            ref={reportModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-listing-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h3 id="report-listing-title" className="text-lg font-semibold text-gray-900">Report this listing</h3>
            <p className="mt-1 text-sm text-gray-600">Help us keep the marketplace trustworthy.</p>
            <Dropdown
              fullWidth
              className="mt-4"
              value={reportReason}
              onChange={setReportReason}
              options={REPORT_REASONS}
              aria-label="Report reason"
            />
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={3}
              placeholder="Additional details (optional)"
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            {reportError ? <p className="mt-2 text-xs text-red-600">{reportError}</p> : null}
            {reportSuccess ? <p className="mt-2 text-xs text-emerald-700">Report submitted. Thank you.</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowReportModal(false)} className="rounded-lg px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={reportSubmitting}
                onClick={handleSubmitReport}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Submit report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal — lightbox with thumbnail rail */}
      {showImageModal && property.images && property.images.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm font-medium text-white/90">
              {currentImageIndex + 1} / {property.images.length}
            </p>
            <WithTooltip label="Close gallery">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="rounded-full border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label="Close gallery"
              >
                <X size={22} className="text-white" />
              </button>
            </WithTooltip>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 sm:px-8">
            <img
              src={property.images[currentImageIndex]?.url}
              alt={imageAlt}
              className="max-h-full max-w-full object-contain"
            />

            {property.images.length > 1 && (
              <>
                <WithTooltip label="Previous image" side="right">
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                    className="absolute left-2 sm:left-4 z-10 rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:p-4"
                  >
                    <ChevronLeft size={28} />
                  </button>
                </WithTooltip>
                <WithTooltip label="Next image" side="left">
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Next image"
                    className="absolute right-2 sm:right-4 z-10 rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:p-4"
                  >
                    <ChevronRight size={28} />
                  </button>
                </WithTooltip>
              </>
            )}
          </div>

          {property.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
              {property.images.map((img, index) => (
                <button
                  key={img.public_id || index}
                  type="button"
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-control border-2 ${
                    currentImageIndex === index ? "border-brand-500" : "border-transparent opacity-60"
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
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
