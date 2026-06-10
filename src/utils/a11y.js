// Returns an onKeyDown handler that fires `handler` on Enter/Space,
// so non-button elements given role="button" behave like real buttons.
export const onActivateKey = (handler) => (e) => {
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    handler(e);
  }
};
