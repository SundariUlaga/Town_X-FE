import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/authStorage";
import { getApiBaseUrl } from "@/lib/apiBase";
import { WithTooltip } from "@/components/ui/WithTooltip";
import TownLoader from "@/components/shared/TownLoader";

const API_BASE_URL = getApiBaseUrl();

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

export default function StoryUploadModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        setError("Please select an image or video file");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        return;
      }

      setError("");
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (caption) formData.append("caption", caption);
      if (location) formData.append("location", location);
      if (user?.id != null) formData.append("user_id", String(user.id));

      const response = await axios.post(`${API_BASE_URL}/api/stories`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        withCredentials: true,
      });

      if (onSuccess) {
        onSuccess(response.data);
      }

      handleClose();
    } catch (error) {
      console.error("❌ Error uploading story:", error);
      setError(
        error.response?.data?.detail ||
          "Failed to upload story. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
    setLocation("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-3 md:px-4 safe-bottom"
          onClick={handleClose}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="bg-white rounded-t-2xl sm:rounded-card shadow-soft-lg w-full max-w-sm md:max-w-md max-h-[92dvh] overflow-y-auto border border-brand-100"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-card">
              <h2 className="text-sm md:text-base font-semibold text-gray-800">
                Create Story
              </h2>
              <WithTooltip label="Close">
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={uploading}
                  aria-label="Close"
                >
                  <X size={18} className="text-gray-600" />
                </button>
              </WithTooltip>
            </div>

            {/* Content */}
            <div className="px-4 py-3 md:px-5 md:py-4">
              {/* Error Message */}
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-control">
                  <p className="text-xs md:text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {!preview ? (
                /* Upload Options */
                <div className="space-y-3 md:space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-brand-50 to-brand-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-soft-md">
                      <Camera
                        size={32}
                        className="md:w-10 md:h-10 text-brand-600"
                      />
                    </div>
                    <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-1.5">
                      Add to Your Story
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600">
                      Share a moment that disappears in 24 hours
                    </p>
                  </div>

                  {/* Camera Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full py-3 md:py-3.5 px-4 bg-gradient-to-r from-brand-500 to-brand-700 text-white rounded-card text-sm md:text-base font-semibold hover:from-brand-600 hover:to-brand-800 transition-all shadow-soft-md hover:shadow-brand-glow flex items-center justify-center gap-2.5"
                  >
                    <Camera size={18} className="md:w-5 md:h-5" />
                    Open Camera
                  </motion.button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* File Upload Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 md:py-3.5 px-4 bg-white border-2 border-brand-500 text-brand-600 rounded-card text-sm md:text-base font-semibold hover:bg-brand-50 transition-all flex items-center justify-center gap-2.5"
                  >
                    <ImageIcon size={18} className="md:w-5 md:h-5" />
                    Choose from Device
                  </motion.button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="bg-brand-50 border border-brand-200 rounded-control p-3">
                    <p className="text-[11px] md:text-xs text-brand-800 text-center font-medium">
                      Supported: Images (JPG, PNG, GIF) & Videos (MP4, MOV)
                    </p>
                    <p className="text-[11px] md:text-xs text-brand-700 text-center">
                      Max size: 50MB
                    </p>
                  </div>
                </div>
              ) : (
                /* Preview and Upload */
                <div className="space-y-3 md:space-y-4">
                  {/* Media Preview */}
                  <div className="relative rounded-card overflow-hidden bg-gray-100 border border-gray-200">
                    {selectedFile && selectedFile.type.startsWith("image/") ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-auto max-h-72 object-contain"
                      />
                    ) : (
                      <video
                        src={preview}
                        controls
                        className="w-full h-auto max-h-72 object-contain"
                      />
                    )}
                    <WithTooltip label="Remove media">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreview(null);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-white rounded-full shadow-soft-md hover:bg-gray-50 transition-colors border border-gray-200"
                        disabled={uploading}
                        aria-label="Remove media"
                      >
                        <X size={16} className="text-gray-600" />
                      </button>
                    </WithTooltip>
                  </div>

                  {/* Caption Input */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5">
                      Caption (Optional)
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write a caption..."
                      rows={3}
                      maxLength={200}
                      className="w-full px-3 md:px-4 py-2.5 border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all resize-none text-xs md:text-sm"
                      disabled={uploading}
                    />
                    <p className="text-[11px] md:text-xs text-gray-500 mt-1 text-right">
                      {caption.length}/200
                    </p>
                  </div>

                  {/* Location Input */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Add location..."
                      maxLength={100}
                      className="w-full px-3 md:px-4 py-2.5 border-2 border-gray-200 rounded-control focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all text-xs md:text-sm"
                      disabled={uploading}
                    />
                  </div>

                  {/* Upload Button */}
                  <motion.button
                    whileHover={{ scale: uploading ? 1 : 1.01 }}
                    whileTap={{ scale: uploading ? 1 : 0.98 }}
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full py-3 md:py-3.5 px-4 bg-gradient-to-r from-brand-500 to-brand-700 text-white rounded-card text-sm md:text-base font-semibold hover:from-brand-600 hover:to-brand-800 transition-all shadow-soft-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Share to Story
                  </motion.button>

                  <div className="bg-blue-50 border border-blue-200 rounded-control p-2.5">
                    <p className="text-[11px] md:text-xs text-blue-700 text-center font-medium">
                      ⏰ Your story will be visible for 24 hours
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          {uploading ? <TownLoader overlay label="Uploading your story" /> : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
