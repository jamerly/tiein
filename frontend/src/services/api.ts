import axios from 'axios';
import type { AxiosError,AxiosResponse,InternalAxiosRequestConfig } from 'axios';

export interface RequestConfig extends Partial<InternalAxiosRequestConfig> {
  skipAuth?: boolean // 跳过认证
  retry?: boolean // 是否重试
  retryCount?: number // 重试次数
}


// 服务端响应接口
export interface ServerResponse<T = any> {
  success: boolean
  message: string
  code: number | null
  data: T
}

// 错误信息接口
export interface ApiError {
  code: number
  message: string
  details?: any
}

const api = axios.create({
  baseURL: '/api',
});


export interface Sort {
  empty: boolean;
  unsorted: boolean;
  sorted: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  unpaged: boolean;
  paged: boolean;
}

export interface PagableResponse<T> {
  content: T[];
  pageable: Pageable;
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  size: number;
  number: number;
  sort: Sort;
  numberOfElements: number;
  empty: boolean;
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse<ServerResponse<any>>) => {
    // Assuming the backend always returns a standardized ApiResponse structure
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        return response.data.data; // Return the actual data payload
      } else {
        // If success is false, treat it as an error and reject the promise
        const error = new Error(response.data.message || 'Unknown API error');
        // You might want to attach more details from response.data to the error object
        return Promise.reject(error);
      }
    }
    return response; // If not a standardized ApiResponse, return as is
  },
  (error: AxiosError) => {
    // Handle HTTP errors (e.g., 404, 500)
    if (error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      // If the error response itself is a standardized ApiResponse
      const apiError = error.response.data as { message: string };
      return Promise.reject(new Error(apiError.message));
    }
    return Promise.reject(error); // Re-throw other errors
  }
);

export class HttpService {
  // GET请求
  static async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
      const response = await api.get<ServerResponse<T>>(url, config)
      return response as T;
  }

  static async getPagable<T = any>(url: string,page?:number, pageSize?:number, config?: RequestConfig): Promise<PagableResponse<T>> {
    // Use the HttpService to fetch paginated data
    if (!page || page < 0) page = 0; // Ensure page starts from 1
    if (!pageSize || pageSize < 1) pageSize = 20; // Default page size
    if( url.indexOf('?') === -1) {
      url += `?page=${page}&pageSize=${pageSize}`;
    } else {
      url += `&page=${page}&pageSize=${pageSize}`;
    }
    return HttpService.get<PagableResponse<T>>(url, config);
  }

  // POST请求
  static async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
      const response = await api.post<ServerResponse<T>>(url, data, config)
      return response as T;
  }

  // PUT请求
  static async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
      const response = await api.put<ServerResponse<T>>(url, data, config)
      return response as T;
  }

  // DELETE请求
  static async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
      const response = await api.delete<ServerResponse<T>>(url, config)
      return response as T;
  }

  // PATCH请求
  static async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
      const response = await api.patch<ServerResponse<T>>(url, data, config)
      return response as T;
  }

  // 文件上传
  static async upload<T = any>(url: string, file: File, config?: RequestConfig): Promise<T> {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post<ServerResponse<T>>(url, formData, {
        ...config,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response as T;
  }
}

export default api;