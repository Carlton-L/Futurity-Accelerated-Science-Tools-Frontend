import type { LoginRequest, LoginResponse, User } from './authTypes';

const API_BASE_URL = 'https://tools.futurity.science/api/auth';

class AuthService {
  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const authToken = token || this.getStoredToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setStoredToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private removeStoredToken(): void {
    localStorage.removeItem('auth_token');
  }

  async login(
    credentials: LoginRequest
  ): Promise<{ token: string; user: User }> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const loginData: LoginResponse = await response.json();

      if (loginData.errors && loginData.errors.length > 0) {
        throw new Error(loginData.errors.join(', '));
      }

      if (!loginData.token) {
        throw new Error('No token received from server');
      }

      // Store the token
      this.setStoredToken(loginData.token);

      // Get user data
      const user = await this.getUser(loginData.token);

      return { token: loginData.token, user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getUser(token?: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData: User = await response.json();
      return userData;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  async verifyToken(token?: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-token`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData: User = await response.json();
      return userData;
    } catch (error) {
      console.error('Verify token error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Remove token from storage
      this.removeStoredToken();

      // You might want to call a logout endpoint here if it exists
      // await fetch(`${API_BASE_URL}/logout`, {
      //   method: 'POST',
      //   headers: this.getAuthHeaders(),
      // });
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove token even if API call fails
      this.removeStoredToken();
    }
  }

  hasStoredToken(): boolean {
    return !!this.getStoredToken();
  }
}

export const authService = new AuthService();
