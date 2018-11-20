export type AddonId = string;

export interface Addon {
  id: AddonId;
  title: string;
  iconUrl?: string;
  contentUrl: string;
  content?: unknown; // Json that gets posted to the iFrame
}

export interface AddonCheckResultSection {
  links: AddonLinks;
}

export interface AddonLinks {
  [id: string]: string;
}
