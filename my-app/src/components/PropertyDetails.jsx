import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Heart, Phone, Mail, MapPin, Home,
  Bed, Bath, Square, Car, Calendar, Building2, CheckCircle2,
  ChevronLeft, ChevronRight, User, Shield, Clock, IndianRupee, X, Flag
} from 'lucide-react';
import { propertyAPI, enquiryAPI, reportAPI } from '../services/api';
import { useAuth } from '@/context/AuthContext';
import TownLoader from "@/components/shared/TownLoader";
import PropertyDetailsSkeleton from "@/components/shared/PropertyDetailsSkeleton";
import { recordRecentlyViewed } from "@/lib/recentlyViewed";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { statusBadgeClass } from "@/lib/statusStyles";
import { EMICalculator } from './EMICalculator';
import { getApiErrorMessage } from '@/lib/apiErrors';
import LoadErrorState from "@/components/shared/LoadErrorState";
import AppNavbar from "@/components/shared/AppNavbar";

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from || '/home';
  const { user } = useAuth();
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
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Misleading listing');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

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
      alert(getApiErrorMessage(err, 'Failed to update favourite. Please try again.'));
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
    } catch (err) {
      setEnquiryError(getApiErrorMessage(err, 'Could not send enquiry. Please try again.'));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <AppNavbar variant="inner" backTo={backTo} maxWidth="7xl" logoTagline="Property Details" />
        <PropertyDetailsSkeleton />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
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

  const imageAlt = `${property.bhk_type} ${property.apartment_type} in ${property.locality}, ${property.city}`;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <AppNavbar
        variant="inner"
        backTo={backTo}
        maxWidth="7xl"
        logoTagline="Property Details"
        extraActions={
          property ? (
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
          ) : null
        }
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
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-brand-600 transition-colors font-medium"
            >
              Properties
            </button>
            <ChevronRight size={16} className="text-gray-400" />
            <span className="text-brand-600 font-semibold truncate max-w-xs">
              {property.bhk_type || 'Property'} in {property.locality || 'Location'}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto">
        {/* Image Gallery */}
        <div className="relative bg-black">
          <div className="relative h-64 md:h-96 lg:h-[500px] overflow-hidden">
            <img
              src={property.images && property.images.length > 0 && property.images[currentImageIndex]?.url
                ? property.images[currentImageIndex].url
                : 'https://via.placeholder.com/800x600?text=No+Image'}
              alt={imageAlt}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowImageModal(true)}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

            {property.images && property.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                  className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2.5 md:p-3 rounded-full hover:bg-black/80 transition-colors shadow-soft-md"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Next image"
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2.5 md:p-3 rounded-full hover:bg-black/80 transition-colors shadow-soft-md"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {property.images && property.images.length > 0 && (
              <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                {currentImageIndex + 1} / {property.images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {property.images && property.images.length > 0 && (
            <div className="flex gap-2 md:gap-3 p-3 md:p-4 overflow-x-auto scrollbar-hide bg-gray-900">
              {property.images.map((img, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={`View image ${index + 1} of ${property.images.length}`}
                  aria-current={currentImageIndex === index ? "true" : undefined}
                  className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-control overflow-hidden border-2 transition-all ${
                    currentImageIndex === index ? 'border-brand-500 scale-105 shadow-soft-md' : 'border-transparent opacity-60 hover:opacity-80'
                  }`}
                >
                  <img src={img.url} alt={`${imageAlt} — photo ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="lg:flex lg:gap-6 lg:px-6 lg:py-6">

          {/* Left Column - Main Details */}
          <div className="lg:flex-1 px-4 lg:px-0 py-4 space-y-5 pb-24 lg:pb-6">

            {/* Price & Title Section - primary card, elevated with brand glow */}
            <div className="bg-gradient-to-br from-white to-brand-50/40 rounded-card shadow-brand-glow border border-brand-100 p-5 md:p-6">
              <div className="mb-3">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                  {property.bhk_type || 'Property'} {property.apartment_type || ''}
                  {property.apartment_name && ` in ${property.apartment_name}`}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-2">
                  {property.created_at ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={14} />
                      {formatRelativeTime(property.created_at)}
                    </span>
                  ) : null}
                  {property.user_type === "Owner" ? (
                    <span className={statusBadgeClass("success")}>
                      <Shield size={12} /> Direct owner listing
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base text-gray-600 mt-2">
                  <MapPin size={18} className="flex-shrink-0 text-brand-600" />
                  <span>{property.locality || 'Location'}, {property.city || 'City'}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <p className="text-3xl md:text-4xl font-bold text-brand-600">
                  {formatPrice(property.expected_price)}
                </p>
                {property.property_for === 'Rent/Lease' && (
                  <span className="text-gray-500 text-base">/month</span>
                )}
              </div>

              {property.property_for === 'Rent/Lease' && (
                <div className="flex flex-wrap gap-4 text-sm md:text-base mb-3">
                  {property.security_deposit && property.security_deposit > 0 && (
                    <div>
                      <span className="text-gray-600">Security: </span>
                      <span className="font-semibold text-gray-800">{formatPrice(property.security_deposit)}</span>
                    </div>
                  )}
                  {property.maintenance_charges && property.maintenance_charges > 0 && (
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
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  For {property.property_for || 'N/A'}
                </span>
                {property.apartment_type && (
                  <span className="px-3.5 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    {property.apartment_type}
                  </span>
                )}
                {property.bhk_type && (
                  <span className="px-3.5 py-1.5 rounded-full text-sm font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                    {property.bhk_type}
                  </span>
                )}
              </div>
            </div>

            {/* EMI Calculator — only meaningful for purchase, not rentals */}
            {property.property_for !== 'Rent/Lease' && (
              <EMICalculator propertyPrice={property.expected_price} />
            )}

            {/* Key Features */}
            <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-5 md:p-6 hover:shadow-soft-md transition-shadow">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Property Overview</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {property.bhk_type && property.bhk_type.split(' ')[0] !== 'Studio' && (
                  <div className="text-center p-3 md:p-4 bg-gray-50 rounded-control hover:bg-brand-50 hover:shadow-soft-sm transition-all">
                    <Bed className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Bedrooms</p>
                    <p className="font-bold text-gray-900 text-base">{property.bhk_type.split(' ')[0]}</p>
                  </div>
                )}
                {property.bathrooms !== undefined && property.bathrooms > 0 && (
                  <div className="text-center p-3 md:p-4 bg-gray-50 rounded-control hover:bg-brand-50 hover:shadow-soft-sm transition-all">
                    <Bath className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Bathrooms</p>
                    <p className="font-bold text-gray-900 text-base">{property.bathrooms}</p>
                  </div>
                )}
                {property.carpet_area && property.carpet_area > 0 && (
                  <div className="text-center p-3 md:p-4 bg-gray-50 rounded-control hover:bg-brand-50 hover:shadow-soft-sm transition-all">
                    <Square className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Carpet Area</p>
                    <p className="font-bold text-gray-900 text-base">{property.carpet_area} sqft</p>
                  </div>
                )}
                {property.balconies !== undefined && property.balconies > 0 && (
                  <div className="text-center p-3 md:p-4 bg-gray-50 rounded-control hover:bg-brand-50 hover:shadow-soft-sm transition-all">
                    <Home className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Balconies</p>
                    <p className="font-bold text-gray-900 text-base">{property.balconies}</p>
                  </div>
                )}
                {property.parking !== undefined && property.parking > 0 && (
                  <div className="text-center p-3 md:p-4 bg-gray-50 rounded-control hover:bg-brand-50 hover:shadow-soft-sm transition-all">
                    <Car className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Parking</p>
                    <p className="font-bold text-gray-900 text-base">{property.parking}</p>
                  </div>
                )}
                {property.floor && property.total_floors && (
                  <div className="text-center p-3 md:p-4 bg-gray-50 rounded-control hover:bg-brand-50 hover:shadow-soft-sm transition-all">
                    <Building2 className="mx-auto mb-2 text-brand-600" size={28} />
                    <p className="text-xs text-gray-600 mb-1">Floor</p>
                    <p className="font-bold text-gray-900 text-base">{property.floor}/{property.total_floors}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-5 md:p-6 hover:shadow-soft-md transition-shadow">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Property Details</h3>
              <div className="space-y-3">
                {property.property_type && (
                  <div className="flex justify-between gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                    <span className="text-gray-600 text-sm md:text-base shrink-0">Property Type</span>
                    <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">{property.property_type}</span>
                  </div>
                )}
                {property.apartment_name && (
                  <div className="flex justify-between gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                    <span className="text-gray-600 text-sm md:text-base shrink-0">Apartment Name</span>
                    <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">{property.apartment_name}</span>
                  </div>
                )}
                {property.carpet_area && property.carpet_area > 0 && (
                  <div className="flex justify-between gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                    <span className="text-gray-600 text-sm md:text-base shrink-0">Carpet Area</span>
                    <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">{property.carpet_area} sq.ft</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                  <span className="text-gray-600 text-sm md:text-base shrink-0">Built-up Area</span>
                  <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">
                    {property.built_up_area && property.built_up_area > 0
                      ? `${property.built_up_area} sq.ft`
                      : 'Not mentioned'}
                  </span>
                </div>
                {property.bathrooms !== undefined && property.bathrooms > 0 && (
                  <div className="flex justify-between gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                    <span className="text-gray-600 text-sm md:text-base shrink-0">Bathrooms</span>
                    <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">{property.bathrooms}</span>
                  </div>
                )}
                {property.balconies !== undefined && property.balconies > 0 && (
                  <div className="flex justify-between gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                    <span className="text-gray-600 text-sm md:text-base shrink-0">Balconies</span>
                    <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">{property.balconies}</span>
                  </div>
                )}
                {property.parking !== undefined && property.parking > 0 && (
                  <div className="flex justify-between gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                    <span className="text-gray-600 text-sm md:text-base shrink-0">Parking</span>
                    <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">{property.parking}</span>
                  </div>
                )}
                {property.floor && property.total_floors && (
                  <div className="flex justify-between gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                    <span className="text-gray-600 text-sm md:text-base shrink-0">Floor</span>
                    <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">{property.floor} of {property.total_floors}</span>
                  </div>
                )}
                {property.property_age && (
                  <div className="flex justify-between gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                    <span className="text-gray-600 text-sm md:text-base shrink-0">Property Age</span>
                    <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">{property.property_age}</span>
                  </div>
                )}
                {property.furnishing_status && (
                  <div className="flex justify-between gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 px-2 rounded transition-colors">
                    <span className="text-gray-600 text-sm md:text-base shrink-0">Furnishing Status</span>
                    <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">{property.furnishing_status}</span>
                  </div>
                )}
                {property.available_from && (
                  <div className="flex justify-between gap-3 py-2.5 hover:bg-gray-50 px-2 rounded transition-colors">
                    <span className="text-gray-600 text-sm md:text-base shrink-0">Available From</span>
                    <span className="font-semibold text-gray-900 text-sm md:text-base text-right break-words min-w-0 max-w-[58%]">
                      {new Date(property.available_from).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            {property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0 && (
              <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-5 md:p-6 hover:shadow-soft-md transition-shadow">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm md:text-base text-gray-700 p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
                      <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-5 md:p-6 hover:shadow-soft-md transition-shadow">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-3">Property Description</h3>
                <p className="text-gray-700 text-sm md:text-base leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Location */}
            {property.address && (
              <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-5 md:p-6 hover:shadow-soft-md transition-shadow">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Location</h3>
                <div className="flex items-start gap-2.5 mb-4 p-3 bg-gray-50 rounded-control">
                  <MapPin size={20} className="text-brand-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm md:text-base text-gray-700">{property.address}</p>
                </div>
                <div className="w-full h-56 md:h-72 bg-gradient-to-br from-gray-50 to-brand-50/30 rounded-card flex items-center justify-center border border-dashed border-brand-200">
                  <div className="text-center">
                    <MapPin size={40} className="mx-auto mb-2 text-brand-300" />
                    <p className="text-sm text-gray-500">Map integration coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Contact Section */}
            <div className="lg:hidden bg-white rounded-card shadow-soft-sm border border-gray-100 p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Details</h3>

              <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                <Shield size={18} className="text-emerald-500 flex-shrink-0" />
                <div className="flex-1 flex items-center gap-2 text-sm text-gray-700">
                  <span>Verified {property.user_type || 'Owner'}</span>
                  <span className="text-gray-400">•</span>
                  <Clock size={14} className="flex-shrink-0 text-gray-400" />
                  <span className="text-gray-600">{formatDate(property.created_at)}</span>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="bg-brand-50 p-4 rounded-control border border-brand-200">
                  <p className="text-xs text-brand-800 mb-1 font-medium">Contact Information</p>
                  <p className="text-sm text-brand-700">Click below to view phone & email</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Contact Card (Desktop Only) */}
          <div className="hidden lg:block lg:w-96">
            <div className="sticky top-24 bg-white rounded-card shadow-soft-lg border border-gray-100 p-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Contact Owner</h3>

              <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                <Shield size={18} className="text-emerald-500 flex-shrink-0" />
                <div className="flex-1 flex items-center gap-2 text-sm text-gray-700">
                  <span>Verified {property.user_type || 'Owner'}</span>
                  <span className="text-gray-400">•</span>
                  <Clock size={14} className="flex-shrink-0 text-gray-400" />
                  <span className="text-gray-600">{formatDate(property.created_at)}</span>
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
                  <p className="text-xs text-emerald-700">Enquiry sent! The owner has been notified.</p>
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
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-soft-lg z-30 safe-bottom">
        <button
          onClick={handleSubmitEnquiry}
          disabled={!canEnquire || enquirySubmitting}
          className="w-full py-3 px-4 rounded-control text-white font-semibold text-sm flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-60"
        >
          <Mail size={18} />
          {enquirySubmitting ? 'Sending...' : 'Send enquiry'}
        </button>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Report this listing</h3>
            <p className="mt-1 text-sm text-gray-600">Help us keep the marketplace trustworthy.</p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option>Misleading listing</option>
              <option>Duplicate listing</option>
              <option>Wrong location or price</option>
              <option>Suspected fraud</option>
              <option>Other</option>
            </select>
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

      {/* Image Modal */}
      {showImageModal && property.images && property.images.length > 0 && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm p-2.5 rounded-full hover:bg-white/20 transition-colors z-10 border border-white/20"
          >
            <X size={22} className="text-white" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={property.images[currentImageIndex]?.url}
              alt={imageAlt}
              className="max-w-full max-h-full object-contain"
            />

            {property.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 bg-white/10 backdrop-blur-sm text-white p-4 rounded-full hover:bg-white/20 transition-colors border border-white/20"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 bg-white/10 backdrop-blur-sm text-white p-4 rounded-full hover:bg-white/20 transition-colors border border-white/20"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
            {currentImageIndex + 1} / {property.images.length}
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
