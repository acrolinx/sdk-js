import {AcrolinxApiError} from './errors';

export type URL = string;
export type LanguageId = string;
export type UserId = string;
export type AuthToken = string;

export interface Progress {
  percent: number;
  message: string;
  retryAfter: number;
}

export interface SuccessResponse<Data, Links = {}> {
  data: Data;
  links: Links;
}

export interface ErrorResponse {
  error: AcrolinxApiError;
}

export interface ProgressResponse {
  progress: Progress;
  links: {
    poll: URL;
  };
}

export type ApiResponse<Data, Links = {}> = SuccessResponse<Data, Links>;
export type AsyncApiResponse<Data, Links = {}> = SuccessResponse<Data, Links> | ProgressResponse;

