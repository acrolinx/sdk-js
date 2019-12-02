export type AddonId = string;

export interface Addon {
  id: AddonId;
  title: string;
  links: {
    icon: string;
    app: string;
  };
}
