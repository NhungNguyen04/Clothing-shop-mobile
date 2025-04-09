import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import axiosInstance from './axiosInstance';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthResult {
  success: boolean;
  data?: AuthResponse;
  error?: string;
}

export class AuthenticationService {
  /**
   * Register a new user
   */
  static readonly API_URL = process.env.API_ENDPOINT || "https://clothing-shop-be-production.up.railway.app";
  
  static async register(name: string, email: string, password: string): Promise<AuthResult> {
    try {
      // Change the baseURL temporarily for this request
      const originalBaseUrl = axiosInstance.defaults.baseURL;
      axiosInstance.defaults.baseURL = this.API_URL;
      
      const response = await axiosInstance.post('/users', {
        name,
        email,
        password,
      });
      
      // Restore original baseURL
      axiosInstance.defaults.baseURL = originalBaseUrl;
      
      const data = response.data;
      
      if (!data.success) {
        return {
          success: false,
          error: data.message || 'Registration failed'
        };
      }
      
      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'An error occurred during registration'
      };
    }
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Change the baseURL temporarily for this request
      const originalBaseUrl = axiosInstance.defaults.baseURL;
      axiosInstance.defaults.baseURL = this.API_URL;
      
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
      });
      
      // Restore original baseURL
      axiosInstance.defaults.baseURL = originalBaseUrl;

      console.log("Log in response", response);
      
      const data = response.data;
      
      if (!data.access_token) {
        return {
          success: false,
          error: data.message || 'Login failed'
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'An error occurred during sign in'
      };
    }
  }

  /**
   * Login with Google OAuth
   */
  static async loginWithGoogle(): Promise<AuthResult> {
    try {
      const redirectUri = Linking.createURL('auth/callback');
      const authUrl = `${this.API_URL}/auth/google?platform=mobile&redirect_uri=${encodeURIComponent(redirectUri)}`;
      console.log("Auth URL", authUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (result.type === 'success' && result.url) {
        const url = result.url;
        
        if (url.includes('token=')) {
          try {
            const token = url.split('token=')[1].split('&')[0];
            let userData = null;
            
            if (url.includes('user=')) {
              try {
                const userDataStr = url.split('user=')[1].split('&')[0];
                userData = JSON.parse(decodeURIComponent(userDataStr));
              } catch (e) {
                console.error('Error parsing user data from URL:', e);
              }
            }

            if (!userData) {
              try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );

                const payload = JSON.parse(jsonPayload);
                userData = {
                  id: payload.sub,
                  email: payload.email,
                  name: payload.name || 'User',
                };
              } catch (e) {
                console.error('Error decoding JWT:', e);
                userData = {
                  id: 'unknown',
                  email: 'user@example.com',
                  name: 'User',
                };
              }
            }

            return {
              success: true,
              data: { 
                access_token: token, 
                user: userData 
              }
            };
          } catch (error) {
            console.error('Error processing authentication:', error);
            return {
              success: false,
              error: 'Failed to complete authentication'
            };
          }
        }
      }
      
      return {
        success: false,
        error: 'Authentication was cancelled or failed'
      };
    } catch (error) {
      console.error('Google sign in error:', error);
      return {
        success: false,
        error: 'Failed to sign in with Google'
      };
    }
  }

  /**
   * Extract user data from token
   */
  static extractUserFromToken(token: string): User | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || 'User',
      };
    } catch (e) {
      console.error('Error decoding JWT:', e);
      return null;
    }
  }

  /**
   * Setup deep linking handler for authentication callbacks
   */
  static setupDeepLinkHandler(callback: (data: AuthResponse) => void): () => void {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes('token=')) {
        try {
          const token = url.split('token=')[1].split('&')[0];
          let userData = null;
          
          if (url.includes('user=')) {
            try {
              const userDataStr = url.split('user=')[1].split('&')[0];
              userData = JSON.parse(decodeURIComponent(userDataStr));
            } catch (e) {
              console.error('Error parsing user data from URL:', e);
            }
          }

          if (!userData) {
            userData = this.extractUserFromToken(token);
            
            if (!userData) {
              userData = {
                id: 'unknown',
                email: 'user@example.com',
                name: 'User',
              };
            }
          }

          callback({ 
            access_token: token, 
            user: userData 
          });
        } catch (error) {
          console.error('Error processing deep link:', error);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink as any);

    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }
}

// This is for backward compatibility with existing code
export const AuthService = AuthenticationService;

// Helper function for base64 decoding on React Native
function atob(data: string): string {
  return Buffer.from(data, 'base64').toString('binary');
}
