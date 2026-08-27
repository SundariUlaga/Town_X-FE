import React, { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Upload, IndianRupee, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { propertyAPI } from "../services/api";
import { LocationPicker } from "./shared/LocationPicker";
import { useLocationContext } from "../context/LocationContext";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { requiredMark } from "@/lib/statusStyles";
import { clearPostDraft, loadPostDraft, savePostDraft } from "@/lib/postDraft";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.15, ease: "easeIn" } },
};

function OptionButton({ selected, onClick, small = false, children }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`p-2 rounded-control border-2 font-medium transition-colors ${small ? "text-[10px]" : "text-xs"} ${
        selected
          ? "border-brand-500 bg-brand-50 text-brand-700 shadow-soft-sm"
          : "border-gray-200 text-gray-700 hover:border-gray-300"
      }`}
    >
      {children}
    </motion.button>
  );
}

export default function CreatePostModal({ isOpen, onClose, onSuccess, editProperty = null }) {
  const shouldReduceMotion = useReducedMotion();
  const { selectedLocation: navbarLocation } = useLocationContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedTalukId, setSelectedTalukId] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("");
  const [locationError, setLocationError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [draftPrompt, setDraftPrompt] = useState(null);
  const closeRef = useRef(() => {});
  const [formData, setFormData] = useState({
    propertyFor: "",
    propertyType: "",
    userType: "",
    bhkType: "",
    apartmentType: "",
    apartmentName: "",
    locality: "",
    city: "",
    address: "",
    builtUpArea: "",
    carpetArea: "",
    floor: "",
    totalFloors: "",
    propertyAge: "",
    furnishingStatus: "",
    parking: "0",
    bathrooms: "0",
    balconies: "0",
    expectedPrice: "",
    maintenanceCharges: "",
    securityDeposit: "",
    availableFrom: "",
    description: "",
    amenities: [],
  });

  const amenitiesList = [
    "Lift",
    "Power Backup",
    "Swimming Pool",
    "Gym",
    "Park",
    "Club House",
    "Security",
    "Water Supply",
    "Visitor Parking",
    "Gas Pipeline",
    "WiFi",
    "AC",
    "Modular Kitchen",
  ];

  const steps = [
    { label: "Property Type" },
    { label: "Details" },
    { label: "Pricing" },
    { label: "Photos" },
  ];

  const validateStep = useCallback(
    (step) => {
      const errors = {};
      if (step === 1) {
        if (!formData.propertyFor) errors.propertyFor = "Select rent, sell, or PG";
        if (!formData.propertyType) errors.propertyType = "Select property type";
        if (!formData.userType) errors.userType = "Select owner or broker";
        if (!formData.apartmentType) errors.apartmentType = "Select apartment type";
        if (!formData.bhkType) errors.bhkType = "Select BHK type";
      }
      if (step === 2) {
        if (!selectedDistrictId) errors.district = "Select a district";
        if (!selectedTalukId) errors.taluk = "Select a taluk";
        if (!selectedVillageId) errors.village = "Select a village";
        if (!formData.address?.trim()) errors.address = "Address is required";
        if (!formData.carpetArea || Number(formData.carpetArea) <= 0) {
          errors.carpetArea = "Enter a valid carpet area";
        }
        if (formData.floor === "" || Number(formData.floor) < 0) errors.floor = "Enter floor number";
        if (!formData.totalFloors || Number(formData.totalFloors) <= 0) {
          errors.totalFloors = "Enter total floors";
        }
        if (!formData.propertyAge) errors.propertyAge = "Select property age";
        if (!formData.furnishingStatus) errors.furnishingStatus = "Select furnishing";
      }
      if (step === 3) {
        if (!formData.expectedPrice || Number(formData.expectedPrice) <= 0) {
          errors.expectedPrice = "Enter a valid price";
        }
        if (!formData.availableFrom) errors.availableFrom = "Select available date";
      }
      return errors;
    },
    [formData, selectedDistrictId, selectedTalukId, selectedVillageId]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (editProperty) {
      setFormData({
        propertyFor: editProperty.property_for || "",
        propertyType: editProperty.property_type || "",
        userType: editProperty.user_type || "",
        bhkType: editProperty.bhk_type || "",
        apartmentType: editProperty.apartment_type || "",
        apartmentName: editProperty.apartment_name || "",
        locality: editProperty.locality || "",
        city: editProperty.city || "",
        address: editProperty.address || "",
        builtUpArea: editProperty.built_up_area ? String(editProperty.built_up_area) : "",
        carpetArea: editProperty.carpet_area ? String(editProperty.carpet_area) : "",
        floor: editProperty.floor != null ? String(editProperty.floor) : "",
        totalFloors: editProperty.total_floors ? String(editProperty.total_floors) : "",
        propertyAge: editProperty.property_age || "",
        furnishingStatus: editProperty.furnishing_status || "",
        parking: String(editProperty.parking ?? 0),
        bathrooms: String(editProperty.bathrooms ?? 0),
        balconies: String(editProperty.balconies ?? 0),
        expectedPrice: editProperty.expected_price ? String(editProperty.expected_price) : "",
        maintenanceCharges: editProperty.maintenance_charges ? String(editProperty.maintenance_charges) : "",
        securityDeposit: editProperty.security_deposit ? String(editProperty.security_deposit) : "",
        availableFrom: editProperty.available_from || "",
        description: editProperty.description || "",
        amenities: editProperty.amenities || [],
      });
      setExistingImages(editProperty.images || []);
      setUploadedFiles([]);
      setCurrentStep(1);
      setDraftPrompt(null);
      return;
    }
    const draft = loadPostDraft();
    if (draft) {
      setDraftPrompt(draft);
      return;
    }
    if (navbarLocation?.district_id) {
      setSelectedDistrictId(String(navbarLocation.district_id));
      setFormData((prev) => ({
        ...prev,
        city: navbarLocation.district_name || prev.city,
      }));
      if (navbarLocation.type === "taluk") setSelectedTalukId(String(navbarLocation.id));
      if (navbarLocation.type === "village") {
        if (navbarLocation.taluk_id) setSelectedTalukId(String(navbarLocation.taluk_id));
        setSelectedVillageId(String(navbarLocation.id));
        setFormData((prev) => ({ ...prev, locality: navbarLocation.name }));
      }
    } else if (navbarLocation?.type === "district") {
      setSelectedDistrictId(String(navbarLocation.id));
      setFormData((prev) => ({ ...prev, city: navbarLocation.name }));
    }
  }, [isOpen, navbarLocation]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = window.setTimeout(() => {
      savePostDraft({
        currentStep,
        formData,
        selectedDistrictId,
        selectedTalukId,
        selectedVillageId,
        uploadedFileNames: uploadedFiles.map((f) => f.name),
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [isOpen, currentStep, formData, selectedDistrictId, selectedTalukId, selectedVillageId, uploadedFiles]);

  const handleDistrictSelect = (district) => {
    setSelectedDistrictId(district ? String(district.id) : "");
    setSelectedTalukId("");
    setSelectedVillageId("");
    setFormData((prev) => ({
      ...prev,
      city: district?.name || "",
      locality: "",
    }));
  };

  const handleTalukSelect = (taluk) => {
    setSelectedTalukId(taluk ? String(taluk.id) : "");
    setSelectedVillageId("");
    setFormData((prev) => ({ ...prev, locality: "" }));
  };

  const handleVillageSelect = (village) => {
    setSelectedVillageId(village ? String(village.id) : "");
    setFormData((prev) => ({ ...prev, locality: village?.name || "" }));
  };

  const resetLocationSelections = () => {
    setSelectedDistrictId("");
    setSelectedTalukId("");
    setSelectedVillageId("");
  };

  const applyDraft = (draft) => {
    setCurrentStep(draft.currentStep || 1);
    setFormData((prev) => ({ ...prev, ...draft.formData }));
    setSelectedDistrictId(draft.selectedDistrictId || "");
    setSelectedTalukId(draft.selectedTalukId || "");
    setSelectedVillageId(draft.selectedVillageId || "");
    setDraftPrompt(null);
  };

  const discardDraft = () => {
    clearPostDraft();
    setDraftPrompt(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAmenityToggle = (amenity) => {
    const updatedAmenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter((item) => item !== amenity)
      : [...formData.amenities, amenity];
    setFormData({ ...formData, amenities: updatedAmenities });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + uploadedFiles.length > 20) {
      alert("Maximum 20 images allowed");
      return;
    }
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleClose = () => {
    if (uploading) return;
    resetLocationSelections();
    setLocationError(null);
    setFieldErrors({});
    setDraftPrompt(null);
    setFormData({
      propertyFor: "",
      propertyType: "",
      userType: "",
      bhkType: "",
      apartmentType: "",
      apartmentName: "",
      locality: "",
      city: "",
      address: "",
      builtUpArea: "",
      carpetArea: "",
      floor: "",
      totalFloors: "",
      propertyAge: "",
      furnishingStatus: "",
      parking: "0",
      bathrooms: "0",
      balconies: "0",
      expectedPrice: "",
      maintenanceCharges: "",
      securityDeposit: "",
      availableFrom: "",
      description: "",
      amenities: [],
    });
    setUploadedFiles([]);
    setExistingImages([]);
    setCurrentStep(1);
    onClose();
  };

  closeRef.current = handleClose;
  const modalRef = useFocusTrap(isOpen, () => closeRef.current());

  const handleSubmit = async () => {
    const totalImages = uploadedFiles.length + existingImages.length;
    if (totalImages < 1) {
      alert("Please upload at least 1 property image");
      return;
    }

    setUploading(true);

    try {
      const submitData = new FormData();

      submitData.append("propertyFor", formData.propertyFor);
      submitData.append("propertyType", formData.propertyType);
      submitData.append("userType", formData.userType);
      submitData.append("bhkType", formData.bhkType);
      submitData.append("apartmentType", formData.apartmentType);
      submitData.append("apartmentName", formData.apartmentName || "");
      submitData.append("locality", formData.locality);
      submitData.append("city", formData.city);
      submitData.append("address", formData.address);
      submitData.append("builtUpArea", formData.builtUpArea || "0");
      submitData.append("carpetArea", formData.carpetArea);
      submitData.append("floor", formData.floor);
      submitData.append("totalFloors", formData.totalFloors);
      submitData.append("propertyAge", formData.propertyAge);
      submitData.append("furnishingStatus", formData.furnishingStatus);
      submitData.append("parking", formData.parking);
      submitData.append("bathrooms", formData.bathrooms);
      submitData.append("balconies", formData.balconies);
      submitData.append("expectedPrice", formData.expectedPrice);
      submitData.append(
        "maintenanceCharges",
        formData.maintenanceCharges || "0"
      );
      submitData.append("securityDeposit", formData.securityDeposit || "0");
      submitData.append("availableFrom", formData.availableFrom);
      submitData.append("description", formData.description || "");
      submitData.append("amenities", JSON.stringify(formData.amenities));

      uploadedFiles.forEach((file) => {
        submitData.append("files", file);
      });

      const response = editProperty
        ? await propertyAPI.updateProperty(editProperty.id, submitData)
        : await propertyAPI.createProperty(submitData);

      clearPostDraft();
      alert(editProperty ? "Listing updated and resubmitted for review!" : "Property posted successfully!");
      if (onSuccess) {
        onSuccess(response.id);
      }
    } catch (error) {
      console.error("Error submitting property:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to post property. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const stepTransition = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.1 } }
    : {
        initial: { opacity: 0, x: 14 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -14 },
        transition: { duration: 0.2, ease: "easeOut" },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-2 md:px-3 py-2 safe-bottom"
          onClick={handleClose}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            ref={modalRef}
            className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-card shadow-soft-lg border border-brand-100 max-h-[92dvh] sm:max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-post-title"
          >
            {/* Header - More Compact */}
            <header className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-white rounded-t-card">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={uploading}
                >
                  <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 id="create-post-title" className="text-sm md:text-base font-semibold text-gray-800">
                  Post Your Property
                </h1>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={uploading}
              >
                <X size={18} className="text-gray-600" />
              </button>
            </header>

            {/* Progress - More Compact */}
            <div className="bg-white px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <React.Fragment key={index}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                          currentStep > index + 1
                            ? "bg-green-500"
                            : currentStep === index + 1
                            ? "bg-brand-500 ring-2 ring-brand-200"
                            : "bg-gray-300"
                        }`}
                      >
                        {currentStep > index + 1 ? (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <div
                            className={`w-2 h-2 rounded-full ${
                              currentStep === index + 1
                                ? "bg-white"
                                : "bg-transparent"
                            }`}
                          />
                        )}
                      </div>
                      <span
                        className={`text-[10px] mt-1 font-medium text-center ${
                          currentStep === index + 1
                            ? "text-brand-600"
                            : currentStep > index + 1
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-0.5 mx-1.5 mb-3 relative bg-gray-300">
                        <div
                          className={`absolute h-full transition-all duration-500 ${
                            currentStep > index + 1
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                          style={{
                            width: currentStep > index + 1 ? "100%" : "0%",
                          }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Scrollable content - More Compact */}
            <div className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50">
              {draftPrompt ? (
                <div className="mb-3 rounded-card border border-status-pending/30 bg-status-pending-bg p-3">
                  <p className="text-xs font-medium text-foreground">Resume your draft?</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Saved {new Date(draftPrompt.savedAt).toLocaleString("en-IN")}
                    {draftPrompt.uploadedFileNames?.length
                      ? ` · ${draftPrompt.uploadedFileNames.length} photo name(s) remembered (re-upload photos)`
                      : ""}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => applyDraft(draftPrompt)}
                      className="rounded-control bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={discardDraft}
                      className="rounded-control border border-border px-3 py-1.5 text-xs font-medium"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              ) : null}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={stepTransition.initial}
                  animate={stepTransition.animate}
                  exit={stepTransition.exit}
                  transition={stepTransition.transition}
                  className="space-y-3"
                >
                  {currentStep === 1 && (
                    <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-4 space-y-3">
                      <h2 className="text-sm font-semibold text-gray-800 mb-1">
                        Property Information
                      </h2>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          You are looking to<span className={requiredMark}>*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {["Rent/Lease", "Sell", "PG/Hostel"].map((option) => (
                            <OptionButton
                              key={option}
                              selected={formData.propertyFor === option}
                              onClick={() => setFormData({ ...formData, propertyFor: option })}
                            >
                              {option}
                            </OptionButton>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Property Type<span className={requiredMark}>*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {["Residential", "Commercial"].map((option) => (
                            <OptionButton
                              key={option}
                              selected={formData.propertyType === option}
                              onClick={() => setFormData({ ...formData, propertyType: option })}
                            >
                              {option}
                            </OptionButton>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          You are<span className={requiredMark}>*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {["Owner", "Broker/Agent"].map((option) => (
                            <OptionButton
                              key={option}
                              selected={formData.userType === option}
                              onClick={() => setFormData({ ...formData, userType: option })}
                            >
                              {option}
                            </OptionButton>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Apartment Type<span className={requiredMark}>*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            "Flat",
                            "Independent House",
                            "Villa",
                            "Builder Floor",
                            "Plot/Land",
                          ].map((option) => (
                            <OptionButton
                              key={option}
                              small
                              selected={formData.apartmentType === option}
                              onClick={() => setFormData({ ...formData, apartmentType: option })}
                            >
                              {option}
                            </OptionButton>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          BHK Type<span className={requiredMark}>*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            "1 RK",
                            "1 BHK",
                            "2 BHK",
                            "3 BHK",
                            "4 BHK",
                            "5 BHK",
                            "5+ BHK",
                          ].map((option) => (
                            <OptionButton
                              key={option}
                              selected={formData.bhkType === option}
                              onClick={() => setFormData({ ...formData, bhkType: option })}
                            >
                              {option}
                            </OptionButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-4 space-y-3">
                      <h2 className="text-sm font-semibold text-gray-800 mb-1">
                        Property Details
                      </h2>

                      <LocationPicker
                        mode="cascading"
                        selectedDistrictId={selectedDistrictId}
                        selectedTalukId={selectedTalukId}
                        selectedVillageId={selectedVillageId}
                        onDistrictSelect={handleDistrictSelect}
                        onTalukSelect={handleTalukSelect}
                        onVillageSelect={handleVillageSelect}
                        locationError={locationError}
                      />
                      {fieldErrors.district || fieldErrors.taluk || fieldErrors.village ? (
                        <p className="text-xs text-status-error">
                          {[fieldErrors.district, fieldErrors.taluk, fieldErrors.village]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      ) : null}

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Apartment/Society Name
                        </label>
                        <input
                          type="text"
                          name="apartmentName"
                          value={formData.apartmentName}
                          onChange={handleInputChange}
                          placeholder="Enter apartment name"
                          className="w-full px-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Full Address<span className={requiredMark}>*</span>
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter complete address"
                          rows="2"
                          className="w-full px-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Carpet Area (sq.ft)
                            <span className={requiredMark}>*</span>
                          </label>
                          <input
                            type="number"
                            name="carpetArea"
                            value={formData.carpetArea}
                            onChange={handleInputChange}
                            placeholder="Sq.ft"
                            className="w-full px-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Built-up Area (sq.ft)
                          </label>
                          <input
                            type="number"
                            name="builtUpArea"
                            value={formData.builtUpArea}
                            onChange={handleInputChange}
                            placeholder="Sq.ft"
                            className="w-full px-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Floor Number<span className={requiredMark}>*</span>
                          </label>
                          <input
                            type="number"
                            name="floor"
                            value={formData.floor}
                            onChange={handleInputChange}
                            placeholder="Floor"
                            className="w-full px-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Total Floors<span className={requiredMark}>*</span>
                          </label>
                          <input
                            type="number"
                            name="totalFloors"
                            value={formData.totalFloors}
                            onChange={handleInputChange}
                            placeholder="Total"
                            className="w-full px-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Property Age<span className={requiredMark}>*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {["0-1 Year", "1-5 Years", "5-10 Years", "10+ Years"].map(
                            (option) => (
                              <OptionButton
                                key={option}
                                small
                                selected={formData.propertyAge === option}
                                onClick={() => setFormData({ ...formData, propertyAge: option })}
                              >
                                {option}
                              </OptionButton>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Furnishing Status<span className={requiredMark}>*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            "Fully Furnished",
                            "Semi Furnished",
                            "Unfurnished",
                          ].map((option) => (
                            <OptionButton
                              key={option}
                              small
                              selected={formData.furnishingStatus === option}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  furnishingStatus: option,
                                })
                              }
                            >
                              {option}
                            </OptionButton>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Bathrooms
                          </label>
                          <input
                            type="number"
                            name="bathrooms"
                            value={formData.bathrooms}
                            onChange={handleInputChange}
                            placeholder="0"
                            className="w-full px-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Balconies
                          </label>
                          <input
                            type="number"
                            name="balconies"
                            value={formData.balconies}
                            onChange={handleInputChange}
                            placeholder="0"
                            className="w-full px-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Parking
                          </label>
                          <input
                            type="number"
                            name="parking"
                            value={formData.parking}
                            onChange={handleInputChange}
                            placeholder="0"
                            className="w-full px-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Amenities
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {amenitiesList.map((amenity) => (
                            <OptionButton
                              key={amenity}
                              small
                              selected={formData.amenities.includes(amenity)}
                              onClick={() => handleAmenityToggle(amenity)}
                            >
                              {amenity}
                            </OptionButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-4 space-y-3">
                      <h2 className="text-sm font-semibold text-gray-800 mb-1">
                        Pricing & Availability
                      </h2>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Expected Price (₹)
                          text-red-500
                        </label>
                        <div className="relative">
                          <IndianRupee
                            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                          <input
                            type="number"
                            name="expectedPrice"
                            value={formData.expectedPrice}
                            onChange={handleInputChange}
                            placeholder="Enter amount"
                            className="w-full pl-8 pr-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                          />
                        </div>
                      </div>

                      {formData.propertyFor === "Rent/Lease" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Security Deposit (₹)
                            </label>
                            <div className="relative">
                              <IndianRupee
                                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={16}
                              />
                              <input
                                type="number"
                                name="securityDeposit"
                                value={formData.securityDeposit}
                                onChange={handleInputChange}
                                placeholder="Enter amount"
                                className="w-full pl-8 pr-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Monthly Maintenance (₹)
                            </label>
                            <div className="relative">
                              <IndianRupee
                                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={16}
                              />
                              <input
                                type="number"
                                name="maintenanceCharges"
                                value={formData.maintenanceCharges}
                                onChange={handleInputChange}
                                placeholder="Enter amount"
                                className="w-full pl-8 pr-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Available From<span className={requiredMark}>*</span>
                        </label>
                        <input
                          type="date"
                          name="availableFrom"
                          value={formData.availableFrom}
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Property Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe your property, locality, and any additional information..."
                          rows="3"
                          className="w-full px-2.5 py-2 text-xs border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 transition-colors"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                          Mention key features, nearby landmarks, and what makes your
                          property special
                        </p>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="bg-white rounded-card shadow-soft-sm border border-gray-100 p-4 space-y-3">
                      <h2 className="text-sm font-semibold text-gray-800 mb-1">
                        {editProperty ? "Update property photos" : "Upload Property Photos"}
                      </h2>

                      {existingImages.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-700 mb-2">
                            Current photos ({existingImages.length}) — upload new files to replace all
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {existingImages.map((img, index) => (
                              <img
                                key={img.public_id || index}
                                src={img.url}
                                alt={`Existing ${index + 1}`}
                                className="w-full h-24 object-cover rounded-control border border-gray-200"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-2 border-dashed border-brand-200 bg-brand-50/30 rounded-card p-4 text-center hover:border-brand-400 hover:bg-brand-50/60 transition-colors">
                        <Upload className="mx-auto mb-2 text-brand-400" size={32} />
                        <p className="text-xs text-gray-600 mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-[10px] text-gray-500 mb-2">
                          Upload at least 1 photo (Max 20)
                        </p>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="inline-block px-4 py-2 bg-brand-500 text-white rounded-control font-medium hover:bg-brand-700 transition-colors text-xs cursor-pointer"
                        >
                          Choose Photos
                        </label>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-700 mb-2">
                            Uploaded Photos ({uploadedFiles.length}/20)
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Upload ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-control border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="absolute top-1 right-1 bg-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-soft-md"
                                >
                                  <X size={14} className="text-gray-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 border border-blue-200 rounded-control p-3">
                        <p className="text-xs text-blue-800 font-semibold mb-1">
                          Tips for better photos:
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1 ml-3 list-disc">
                          <li>Use natural lighting</li>
                          <li>Capture all rooms and amenities</li>
                          <li>Show wide angles of living spaces</li>
                          <li>Include exterior and common area shots</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom navigation - Compact */}
            <div className="border-t border-gray-200 px-3 py-2.5 bg-white rounded-b-card flex-shrink-0">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={uploading}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-control font-semibold hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={currentStep === 4 ? handleSubmit : nextStep}
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 text-white rounded-control font-semibold transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-700"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Uploading...
                    </>
                  ) : currentStep === 4 ? (
                    "Submit Property"
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
