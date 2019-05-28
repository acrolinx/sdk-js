export type UrlString = string;
export type URL = UrlString;
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

export function isProgressResponse<T>(asyncApiResponse: AsyncApiResponse<T>): asyncApiResponse is ProgressResponse {
  return !!(asyncApiResponse as ProgressResponse).progress;
}

export interface AsyncStartedProcessLinks {
  result: UrlString;
  cancel: UrlString;
}

export interface AsyncStartedProcess {
  links: AsyncStartedProcessLinks;
}
