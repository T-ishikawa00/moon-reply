export const CUSTOMER_AUTH_STATE_CHANGED_EVENT =
  "moon-reply:customer-auth-state-changed";

export function announceCustomerAuthStateChanged() {
  window.dispatchEvent(new Event(CUSTOMER_AUTH_STATE_CHANGED_EVENT));
}
