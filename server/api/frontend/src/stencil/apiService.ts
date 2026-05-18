import { BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react';
import Axios, { AxiosError, AxiosRequestConfig } from 'axios';
import appConfig from '@/configs/app.config';
import { resolveJurisdictionBaseUrl } from '@/configs/jurisdiction.config';
import type { Auth, User } from 'firebase/auth';

// Token provider interface - abstracts token retrieval
export interface TokenProvider {
   getToken(): Promise<string | null>;
}

// Firebase token provider implementation
export class FirebaseTokenProvider implements TokenProvider {
   constructor(
      private auth: Auth,
      private user: User
   ) {}

   async getToken(): Promise<string | null> {
      try {
         if (!this.user) {
            return null;
         }
         return await this.user.getIdToken();
      } catch (error) {
         console.error('Failed to get Firebase token:', error);
         return null;
      }
   }

   async forceRefresh(): Promise<string | null> {
      try {
         if (!this.user) {
            return null;
         }
         return await this.user.getIdToken(true);
      } catch (error) {
         console.error('Failed to force-refresh Firebase token:', error);
         return null;
      }
   }
}

// Default token provider implementation
class DefaultTokenProvider implements TokenProvider {
   async getToken(): Promise<string | null> {
      return null;
   }
}

// Static token provider — used for local dev auth (stores a pre-minted JWT)
export class StaticTokenProvider implements TokenProvider {
   constructor(private readonly token: string) {}
   async getToken(): Promise<string | null> {
      return this.token;
   }
}

// Global token provider instance
let tokenProvider: TokenProvider = new DefaultTokenProvider();

// Function to set the token provider (called by auth system)
export const setTokenProvider = (provider: TokenProvider) => {
   tokenProvider = provider;
};

function buildHeaders(token: string | null, queryHeaders?: Record<string, string>): Record<string, string> {
   const headers: Record<string, string> = {};
   if (token) {
      headers.Authorization = `Bearer ${token}`;
   }
   if (appConfig.adminGateToken) {
      headers['X-Admin-Token'] = appConfig.adminGateToken;
   }
   return { ...headers, ...(queryHeaders || {}) };
}

function isTokenExpiredResponse(error: AxiosError): boolean {
   const data = error.response?.data as Record<string, unknown> | undefined;
   return error.response?.status === 401 && data?.error === 'TOKEN_EXPIRED';
}

const axiosBaseQuery =
   (): BaseQueryFn<AxiosRequestConfig<unknown>, unknown, AxiosError> =>
   async ({ url, method, data, params, headers: queryHeaders }) => {
      const endpointUrl = url!.replace(/^\//, '');
      const jurisdictionBase = resolveJurisdictionBaseUrl(endpointUrl);
      const baseUrl = (jurisdictionBase ?? appConfig.apiBaseUrl).replace(/\/$/, '');
      const fullUrl = `${baseUrl}/${endpointUrl}`;

      const token = await tokenProvider.getToken();

      try {
         const result = await Axios({
            url: fullUrl,
            method,
            data,
            params,
            headers: buildHeaders(token, queryHeaders as Record<string, string>),
         });
         return { data: result.data };
      } catch (axiosError) {
         const error = axiosError as AxiosError;

         if (isTokenExpiredResponse(error) && tokenProvider instanceof FirebaseTokenProvider) {
            const freshToken = await tokenProvider.forceRefresh();
            if (freshToken) {
               try {
                  const retry = await Axios({
                     url: fullUrl,
                     method,
                     data,
                     params,
                     headers: buildHeaders(freshToken, queryHeaders as Record<string, string>),
                  });
                  return { data: retry.data };
               } catch (retryError) {
                  return { error: retryError as AxiosError };
               }
            }
         }

         return { error };
      }
   };

export const apiService = createApi({
   baseQuery: axiosBaseQuery(),
   endpoints: () => ({}),
   reducerPath: 'apiService',
});

export default apiService;
