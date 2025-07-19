export abstract class AppError extends Error {
  abstract readonly title: string;
  abstract readonly userMessage: string;
  abstract readonly code: string;
  abstract readonly recoveryAction?: {
    label: string;
    handler: () => void;
  };

  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      title: this.title,
      userMessage: this.userMessage,
      code: this.code,
      stack: this.stack,
      metadata: this.metadata,
      originalError: this.originalError?.message,
    };
  }
}

export class ValidationError extends AppError {
  readonly title = 'Validation Error';
  readonly code = 'VALIDATION_ERROR';
  
  get userMessage(): string {
    return this.message || 'Please check your input and try again.';
  }

  get recoveryAction() {
    return undefined;
  }
}

export class AuthenticationError extends AppError {
  readonly title = 'Authentication Required';
  readonly code = 'AUTHENTICATION_ERROR';
  
  get userMessage(): string {
    return 'Please log in to continue.';
  }
  
  get recoveryAction() {
    return {
      label: 'Log In',
      handler: () => {
        // Navigation to login will be handled by the service
      },
    };
  }
}

export class AuthorizationError extends AppError {
  readonly title = 'Access Denied';
  readonly code = 'AUTHORIZATION_ERROR';
  
  get userMessage(): string {
    return 'You do not have permission to perform this action.';
  }

  get recoveryAction() {
    return undefined;
  }
}

export class NotFoundError extends AppError {
  readonly title = 'Not Found';
  readonly code = 'NOT_FOUND_ERROR';
  
  get userMessage(): string {
    return 'The requested resource could not be found.';
  }
  
  get recoveryAction() {
    return {
      label: 'Go Back',
      handler: () => {
        // Navigation back will be handled by the service
      },
    };
  }
}

export class NetworkError extends AppError {
  readonly title = 'Connection Error';
  readonly code = 'NETWORK_ERROR';
  
  get userMessage(): string {
    return 'Please check your internet connection and try again.';
  }
  
  get recoveryAction() {
    return {
      label: 'Retry',
      handler: () => {
        // Retry logic will be handled by the service
      },
    };
  }
}

export class ServerError extends AppError {
  readonly title = 'Server Error';
  readonly code = 'SERVER_ERROR';
  
  get userMessage(): string {
    return 'Something went wrong on our end. Please try again later.';
  }
  
  get recoveryAction() {
    return {
      label: 'Retry',
      handler: () => {
        // Retry logic will be handled by the service
      },
    };
  }
}

export class UnknownError extends AppError {
  readonly title = 'Unexpected Error';
  readonly code = 'UNKNOWN_ERROR';
  
  get userMessage(): string {
    return 'An unexpected error occurred. Please try again.';
  }
  
  get recoveryAction() {
    return {
      label: 'Retry',
      handler: () => {
        // Retry logic will be handled by the service
      },
    };
  }
}