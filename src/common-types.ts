/*
 * Copyright 2018-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type UrlString = string;
export type URL = UrlString;
export type LanguageId = string;
export type UserId = string;
export type Username = string;
export type AccessToken = string;

export interface Progress {
  percent: number; // TODO: optional?
  message: string; // TODO: optional?

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
    poll: URL; // TODO: optional? empty?
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
  data: {
    id: string;
  };
  links: AsyncStartedProcessLinks;
}

export enum ServiceType {
  ACROLINX_ONE,
  ACROLINX_CORE,
}
