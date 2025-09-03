import { errorHandler } from '$lib/stores/error';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic HTTP request with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    operation: string = 'Operazione API'
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Default headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle successful responses
      if (response.ok) {
        let data: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as T;
        }

        return {
          success: true,
          data,
          statusCode: response.status
        };
      }

      // Handle API errors
      let errorMessage = 'Errore sconosciuto';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      // Show user-friendly error
      errorHandler.handleApiError(response, operation);

      return {
        success: false,
        error: errorMessage,
        statusCode: response.status
      };

    } catch (error) {
      // Handle network errors
      const message = error instanceof Error ? error.message : 'Errore di rete';
      errorHandler.error(
        'Errore di Connessione',
        'Impossibile contattare il server. Controlla la connessione internet.',
        `${operation}: ${message}`
      );

      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, operation?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, operation);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    operation?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      operation
    );
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    operation?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      operation
    );
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, operation?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, operation);
  }

  /**
   * Upload file
   */
  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    operation: string = 'Upload file'
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      },
      operation
    );
  }
}

// Default API client instance
export const api = new ApiClient();

// Utility functions for common patterns
export const apiUtils = {
  /**
   * Handles async operations with loading state and error handling
   */
  async withLoading<T>(
    operation: () => Promise<ApiResponse<T>>,
    setLoading: (loading: boolean) => void
  ): Promise<T | null> {
    setLoading(true);
    try {
      const response = await operation();
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } finally {
      setLoading(false);
    }
  },

  /**
   * Confirms action before execution
   */
  async withConfirmation<T>(
    message: string,
    operation: () => Promise<ApiResponse<T>>
  ): Promise<T | null> {
    if (confirm(message)) {
      const response = await operation();
      if (response.success && response.data) {
        errorHandler.success('Operazione Completata', 'L\'operazione è stata eseguita con successo.');
        return response.data;
      }
    }
    return null;
  }
};

// Shortcuts for committente-specific operations
export const committenteApi = {
  get: <T>(committenteId: number, endpoint: string, operation?: string) =>
    api.get<T>(`/committenti/${committenteId}${endpoint}`, operation),
    
  post: <T>(committenteId: number, endpoint: string, data?: any, operation?: string) =>
    api.post<T>(`/committenti/${committenteId}${endpoint}`, data, operation),
    
  put: <T>(committenteId: number, endpoint: string, data?: any, operation?: string) =>
    api.put<T>(`/committenti/${committenteId}${endpoint}`, data, operation),
    
  delete: <T>(committenteId: number, endpoint: string, operation?: string) =>
    api.delete<T>(`/committenti/${committenteId}${endpoint}`, operation),
};