export interface IntegrationDetails {
  name: string;
  version: string;
  type: IntegrationType;
  systemInfo: SystemInfo;
}

export interface SystemInfo {
  operatingSystemInfo?: OperatingSystemInfo;
  browserInfo?: Browser;
  sidebarInfo?: SidebarInfo;
}

export interface SidebarInfo {
  version: string;
}

export enum IntegrationType {
  authoring = 'authoring',
  automated = 'automated',
}

export interface OperatingSystemInfo {
  name: string;
  version: string;
  family: OperatingSystemFamily;
}

export type Browser = {
  name: BrowserNames;
  version: string;
};

export enum BrowserNames {
  chrome = 'chrome',
  firefox = 'firefox',
  safari = 'safari',
  edge = 'edge',
  javafx = 'javafx',
  other = 'other',
}

export enum OperatingSystemFamily {
  windows = 'windows',
  mac = 'mac',
  linux = 'linux',
  other = 'other',
}
