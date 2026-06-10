import { useEffect } from 'react';

// When a modal is open, push a history entry so that the browser back button
// (or mobile gesture) closes the modal instead of leaving the page.
//
// Usage:
//   useModalBackButton(isOpen, () => setIsOpen(false));
export function useModalBackButton(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ modalOpen: true }, '');

    const handlePop = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePop);

    return () => {
      window.removeEventListener('popstate', handlePop);
      // If the modal is being closed by code (not by back-nav), pop the marker
      // entry we pushed so the user's history isn't polluted.
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
}
