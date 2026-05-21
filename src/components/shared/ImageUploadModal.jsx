import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { Modal } from '../ui';

/**
 * ImageUploadModal Component
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Called when modal is closed
 * @param {function} onUpload - Called when file is successfully uploaded
 * @param {string} title - Modal title
 * @returns {JSX.Element}
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
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSave = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onUpload(selectedFile);
            handleCancel();
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
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
            
            {selectedFile && !isUploading && (
              <motion.p 
                className="text-green-600 font-semibold mt-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                Selected: {selectedFile.name}
              </motion.p>
            )}
          </>
        ) : (
          <motion.div 
            className="w-full max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-300 dark:bg-[#252b3b] rounded-full h-3 overflow-hidden">
                <motion.div
                  className="bg-blue-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xl font-semibold text-gray-700 dark:text-slate-300 min-w-[3rem]">
                {uploadProgress}%
              </span>
            </div>
          </motion.div>
        )}
        
        <p className="text-sm text-gray-500 dark:text-slate-500 mt-6">
          <span className="text-red-500">*</span> Files supported {accept}
        </p>
      </motion.div>

      <motion.div 
        className="flex items-center justify-center space-x-4 mt-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
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
          Save
        </motion.button>
        <motion.button
          onClick={handleCancel}
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
      </motion.div>
    </Modal>
  );
};