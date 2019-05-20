export type AddonId = string;

export enum AddonType {
  default = "default",
  experimental = "experimental"
}

export interface Addon {
  id: AddonId;
  title: string;
  links: {
    icon: string;

    /**
     * Link to arbitrary data that is posted to the app iFrame.
     * Is set in the addons array of the check result.
     */
    appData?: string;

    app: string;
  };

  // The following attributes are experimental and will change.
  showCheckButton?: boolean;
  type?: AddonType;
}

export interface AddonCheckResult {
  id: AddonId;
  content: unknown;
}
