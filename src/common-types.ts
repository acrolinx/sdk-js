export type URL = string;
export type LanguageId = string;
export type UserId = string;
export type Username = string;
export type AuthToken = string;

export interface Progress {
  percent: number;  // TODO: optional?
  message: string;  // TODO: optional?

  /**
   * Duration in seconds
   */
  retryAfter: number;
}

export interface SuccessResponse<Data, Links = {}> {
  data: Data;
  links: Links;
}

export interface ProgressResponse {
  progress: Progress;
  links: {
    poll: URL;  // TODO: optional? empty?
  };
}

export type ApiResponse<Data, Links = {}> = SuccessResponse<Data, Links>;
export type AsyncApiResponse<Data, Links = {}> = SuccessResponse<Data, Links> | ProgressResponse;

export interface StringMap {
  [index: string]: string;
}
