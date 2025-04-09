export interface IntegrationDetails {
  name: string;
  version: string;
  type: IntegrationType;
  system: SystemInfo;
}

export interface SystemInfo {
  operatingSystem?: OperatingSystem;
  browser?: Browser;
  sidebar?: SidebarInfo;
}

export interface SidebarInfo {
  version: string;
}

export enum IntegrationType {
  authoring = 'authoring',
  automated = 'automated',
}

export interface OperatingSystem {
  name: string;
  version: string;
  family: OperatingSystemFamily;
}

export type Browser =
  | { name: BrowserNames.chrome; version: string; engine: BrowserEngine.blink }
  | { name: BrowserNames.firefox; version: string; engine: BrowserEngine.gecko }
  | { name: BrowserNames.safari; version: string; engine: BrowserEngine.webkit }
  | { name: BrowserNames.edge; version: string; engine: BrowserEngine.blink }
  | { name: BrowserNames.javafx; version: string; engine: BrowserEngine.webkit }
  | { name: BrowserNames.other; version: string; engine: BrowserEngine.other };

export enum BrowserNames {
  chrome = 'chrome',
  firefox = 'firefox',
  safari = 'safari',
  edge = 'edge',
  javafx = 'javafx',
  other = 'other',
}

export enum BrowserEngine {
  blink = 'blink',
  gecko = 'gecko',
  webkit = 'webkit',
  other = 'other',
}

export enum OperatingSystemFamily {
  windows = 'windows',
  mac = 'mac',
  linux = 'linux',
  other = 'other',
}
