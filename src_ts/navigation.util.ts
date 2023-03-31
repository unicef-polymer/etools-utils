/**
 * 'popstate' event is usually listened to by the routing system of the app
 */
export function updateAppLocation(path: string, eventToTrigger: string) {
  history.pushState(window.history.state, '', path);  
  window.dispatchEvent(new CustomEvent(eventToTrigger ? eventToTrigger : 'popstate'));
}

/**
 * Use when you do not want to create another entry in the browser history.
 * So that the back button doesn't take you through another history entry.
 */
export function replaceAppLocation(path: string, eventToTrigger: string) {
  history.replaceState(window.history.state, '', path);
  window.dispatchEvent(new CustomEvent(eventToTrigger ? eventToTrigger : 'popstate'));
}
