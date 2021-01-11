export interface PlatformFeatures {
  /**
   * Indicates that the server runs in Targets mode.
   */
  enableTargetService?: boolean;
}

export interface PlatformFeaturesResponse {
  features: PlatformFeatures;
}
