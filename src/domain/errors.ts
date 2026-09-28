/** Typed application-level errors with machine-readable codes. */

export type ErrorCode =
  | 'CONFIGURATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'GENERATION_IMPOSSIBLE'
  | 'GENERATION_TIMEOUT'
  | 'GENERATION_CANCELLED'
  | 'PERSISTENCE_ERROR'
  | 'MIGRATION_ERROR'
  | 'IMPORT_ERROR'
  | 'EXPORT_ERROR';

export interface AppErrorContext {
  [key: string]: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly context: AppErrorContext;

  constructor(code: ErrorCode, message: string, context: AppErrorContext = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, context: AppErrorContext = {}) {
    super('CONFIGURATION_ERROR', message, context);
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context: AppErrorContext = {}) {
    super('VALIDATION_ERROR', message, context);
    this.name = 'ValidationError';
  }
}

export class GenerationImpossibleError extends AppError {
  constructor(message: string, context: AppErrorContext = {}) {
    super('GENERATION_IMPOSSIBLE', message, context);
    this.name = 'GenerationImpossibleError';
  }
}

export class GenerationTimeoutError extends AppError {
  constructor(message: string, context: AppErrorContext = {}) {
    super('GENERATION_TIMEOUT', message, context);
    this.name = 'GenerationTimeoutError';
  }
}

export class GenerationCancelledError extends AppError {
  constructor(message: string, context: AppErrorContext = {}) {
    super('GENERATION_CANCELLED', message, context);
    this.name = 'GenerationCancelledError';
  }
}

export class PersistenceError extends AppError {
  constructor(message: string, context: AppErrorContext = {}) {
    super('PERSISTENCE_ERROR', message, context);
    this.name = 'PersistenceError';
  }
}

export class MigrationError extends AppError {
  constructor(message: string, context: AppErrorContext = {}) {
    super('MIGRATION_ERROR', message, context);
    this.name = 'MigrationError';
  }
}

export class ImportError extends AppError {
  constructor(message: string, context: AppErrorContext = {}) {
    super('IMPORT_ERROR', message, context);
    this.name = 'ImportError';
  }
}

export class ExportError extends AppError {
  constructor(message: string, context: AppErrorContext = {}) {
    super('EXPORT_ERROR', message, context);
    this.name = 'ExportError';
  }
}
