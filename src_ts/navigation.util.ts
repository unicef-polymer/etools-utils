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

export function withDefaultParams(queryParams: any) {
  return {...queryParams, page: 1, page_size: 10};
}

export function appendQuery(url: string, ...theRestOfArgs: any[]) {
  if (url === undefined) {
    return;
  }

  return url + '?' + buildQueryFromChunks(theRestOfArgs);
}

export function buildQueryFromChunks(chunks: any[]): string {
  return chunks
    .map((chunk) => {
      switch (typeof chunk) {
        case 'string':
          return chunk;
        case 'object':
          return buildQueryFromChunks(
            Object.keys(chunk).map((key) => {
              return [encodeURIComponent(key), encodeURIComponent(chunk[key])].join('=');
            })
          );
        default:
          return '';
      }
    })
    .join('&');
}
