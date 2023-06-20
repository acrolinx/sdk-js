/*
 * Copyright 2023-present Acrolinx GmbH
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

export interface Integration {
  components?: SoftwareComponent[];
}

/**
 * Provides information about your integration and other client software components for the about dialog and
 * analytics.
 */
export interface SoftwareComponent {
  /**
   * The id of the software component.
   * Examples: 'com.acrolinx.win.word.32bit', 'com.acrolinx.mac.word'
   */
  id: string;

  /**
   * The name if the software component.
   * This name will be displayed in the UI.
   */
  name: string;

  /**
   * The version of the software component.
   * Format: ${major}.${minor}.${patch}.${buildNumber}
   * Example: '1.2.3.574'
   */
  version: string;

  /**
   * @See SoftwareComponentCategory
   * Default value if omitted: 'DEFAULT'
   */
  category?: string;
}

export declare const SoftwareComponentCategory: {
  /**
   * There should be exactly one MAIN component.
   * This information is used to identify your client on the server.
   * Version information about this components might be displayed more prominently.
   */
  MAIN: string;
  /**
   * Version information about such components are displayed in the about
   * dialog.
   */
  DEFAULT: string;
  /**
   * Version information about such components are displayed in the detail section of the about
   * dialog or not at all.
   */
  DETAIL: string;
};
