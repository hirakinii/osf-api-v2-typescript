export class OsfApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OsfApiError';
    }
}

export class OsfAuthenticationError extends OsfApiError {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'OsfAuthenticationError';
    }
}

export class OsfPermissionError extends OsfApiError {
    constructor(message = 'Permission denied') {
        super(message);
        this.name = 'OsfPermissionError';
    }
}

export class OsfNotFoundError extends OsfApiError {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'OsfNotFoundError';
    }
}

export class OsfRateLimitError extends OsfApiError {
    constructor(message = 'Rate limit exceeded') {
        super(message);
        this.name = 'OsfRateLimitError';
    }
}

export class OsfServerError extends OsfApiError {
    constructor(message = 'Internal server error') {
        super(message);
        this.name = 'OsfServerError';
    }
}
