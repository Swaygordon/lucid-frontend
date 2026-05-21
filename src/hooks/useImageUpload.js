// [API] This hook manages profile image uploads.
// Replace the fake progress simulation in onSave() with a real multipart upload:
//   POST /uploads/profile-image  (FormData, Content-Type: multipart/form-data)
//   → { url: "https://cdn.lucid.com/avatars/..." }
// Then patch the user record: PATCH /users/:id { profileImage: url }
// Use XMLHttpRequest's onprogress event (or fetch + ReadableStream) for real uploadProgress.
import { useState } from "react";

export const useImageUpload = () => {
  const [open, setOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const onDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();

  setDragCounter(0);
  setDragActive(false);

  const file = e.dataTransfer.files[0];
  if (!file || !ACCEPTED_TYPES.includes(file.type)) return;

  setSelectedFile(file);
};


const onFileChange = (e) => {
  const file = e.target.files[0];
  if (!file || !ACCEPTED_TYPES.includes(file.type)) return;
  setSelectedFile(file);
};


  const openModal = () => setOpen(true);
  const closeModal = () => {
    setOpen(false);
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
  };

 const [dragCounter, setDragCounter] = useState(0);

const onDrag = (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (e.type === "dragenter") {
    setDragCounter((c) => c + 1);
    setDragActive(true);
  }

  if (e.type === "dragleave") {
    setDragCounter((c) => {
      if (c - 1 <= 0) {
        setDragActive(false);
        return 0;
      }
      return c - 1;
    });
  }
};



  // [API] POST /uploads/profile-image (FormData)  → { url }
  // then PATCH /users/:id { profileImage: url }
  // Use XHR onprogress for real uploadProgress updates.
  const onSave = () => {
    if (!selectedFile) return;
    closeModal();
  };

  return {
    open,
    dragActive,
    selectedFile,
    isUploading,
    uploadProgress,
    openModal,
    closeModal,
    onDrag,
    onDrop,
    onFileChange,
    onSave,
  };
};
