/** Base class for all OSF API related errors */
export class OsfApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OsfApiError';
  }
}

/** Thrown when authentication fails (401) */
export class OsfAuthenticationError extends OsfApiError {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'OsfAuthenticationError';
  }
}

/** Thrown when the user lacks permission for the request (403) */
export class OsfPermissionError extends OsfApiError {
  constructor(message = 'Permission denied') {
    super(message);
    this.name = 'OsfPermissionError';
  }
}

/** Thrown when a resource is not found (404) */
export class OsfNotFoundError extends OsfApiError {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'OsfNotFoundError';
  }
}

/** Thrown when the rate limit is exceeded (429) */
export class OsfRateLimitError extends OsfApiError {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'OsfRateLimitError';
  }
}

/** Thrown when the OSF server returns a 5xx error */
export class OsfServerError extends OsfApiError {
  constructor(message = 'Internal server error') {
    super(message);
    this.name = 'OsfServerError';
  }
}
