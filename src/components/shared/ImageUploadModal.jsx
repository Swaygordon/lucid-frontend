import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { Modal } from '../ui';

/**
 * ImageUploadModal Component
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Called when modal is closed
 * @param {function} onUpload - Async function(file, onProgress) that performs the real upload.
 *                              Must resolve on success or throw on failure.
 * @param {string} title - Modal title
 * @param {string} accept - Accepted file types
 */
export const ImageUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  title = "Upload Image",
  accept = ".png,.jpg,.jpeg,.webp"
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Reset state every time the modal opens.
  // This was the #1 cause of the duplicate-key warning:
  // reopening the modal kept the previous `selectedFile` and re-uploaded it.
  useEffect(() => {
    if (isOpen) {
      setDragActive(false);
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMsg(null);

    try {
      // Call the parent uploader, which performs the ACTUAL upload.
      // The parent receives an onProgress callback to report progress.
      await onUpload(selectedFile, (p) => setUploadProgress(p));
      setUploadProgress(100);
      // Small delay so the user can see 100%
      setTimeout(() => {
        handleCancel(true);
      }, 300);
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMsg(err?.message || 'Upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // `force` allows closing during the brief 100% delay after a successful upload
  const handleCancel = (force = false) => {
    if (isUploading && !force) return;
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setErrorMsg(null);
    setDragActive(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={title} size="md">
      <motion.div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-4 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-blue-600'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {!isUploading ? (
          <>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            </motion.div>

            <label htmlFor="file-upload" className="cursor-pointer">
              <motion.div
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Browse
              </motion.div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleFileChange}
              />
            </label>

            <p className="text-gray-600 dark:text-slate-400 text-lg mb-2">Drop a file here</p>

            {selectedFile && (
              <motion.p
                className="text-green-600 font-semibold mt-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                Selected: {selectedFile.name}
              </motion.p>
            )}

            {errorMsg && (
              <p className="text-red-600 font-semibold mt-4">{errorMsg}</p>
            )}
          </>
        ) : (
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-300 dark:bg-[#252b3b] rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-xl font-semibold text-gray-700 dark:text-slate-300 min-w-[3rem]">
                {uploadProgress}%
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-500 mt-4">
              Uploading... please wait
            </p>
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-slate-500 mt-6">
          <span className="text-red-500">*</span> Files supported {accept}
        </p>
      </motion.div>

      <div className="flex items-center justify-center space-x-4 mt-8">
        <motion.button
          onClick={handleSave}
          disabled={!selectedFile || isUploading}
          className={`px-12 py-3 rounded-lg font-semibold transition-colors ${
            selectedFile && !isUploading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 dark:bg-[#252b3b] text-gray-500 dark:text-slate-500 cursor-not-allowed'
          }`}
          whileHover={selectedFile && !isUploading ? { scale: 1.05 } : {}}
          whileTap={selectedFile && !isUploading ? { scale: 0.95 } : {}}
        >
          {isUploading ? 'Uploading…' : 'Save'}
        </motion.button>
        <motion.button
          onClick={() => handleCancel()}
          disabled={isUploading}
          className={`px-12 py-3 rounded-lg font-semibold border-2 transition-colors ${
            isUploading
              ? 'border-gray-300 dark:border-[#2d3748] text-gray-400 dark:text-slate-500 cursor-not-allowed'
              : 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
          whileHover={!isUploading ? { scale: 1.05 } : {}}
          whileTap={!isUploading ? { scale: 0.95 } : {}}
        >
          Cancel
        </motion.button>
      </div>
    </Modal>
  );
};