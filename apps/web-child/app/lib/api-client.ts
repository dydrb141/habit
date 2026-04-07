/**
 * Type-safe API client with automatic JWT token handling
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get JWT token from localStorage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  /**
   * Remove token and redirect to login
   */
  private handleUnauthorized(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  /**
   * Make HTTP request with automatic token inclusion
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const token = this.getToken();
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options?.headers,
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 seconds
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new ApiError('Unauthorized', 401, 'Token expired or invalid');
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Provide user-friendly error messages
        let userMessage = errorData.detail || 'Request failed';

        if (response.status === 400) {
          userMessage = errorData.detail || '잘못된 요청입니다';
        } else if (response.status === 404) {
          userMessage = '요청한 리소스를 찾을 수 없습니다';
        } else if (response.status === 500) {
          userMessage = '서버 오류가 발생했습니다';
        } else if (response.status === 503) {
          userMessage = '서버가 일시적으로 사용할 수 없습니다';
        }

        throw new ApiError(
          userMessage,
          response.status,
          errorData.detail
        );
      }

      // Parse JSON response
      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle specific error types
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(
          '네트워크 연결을 확인해주세요',
          0,
          'Network connection failed'
        );
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(
          '요청 시간이 초과되었습니다',
          0,
          'Request timeout'
        );
      }

      // Generic network error
      throw new ApiError(
        '서버에 연결할 수 없습니다',
        0,
        String(error)
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  }

  /**
   * Remove authentication token
   */
  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
  }
}

// Singleton instance
export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
);
