export interface SaintIconCredit {
  source: string;
  author: string;
  license: string;
  licenseUrl: string;
  title: string;
  modification: string;
}

export interface SaintDetail {
  id: string;
  prefix: string;
  name: string;
  epithet: string;
  shortDescription: string;
  tradition: "Oriental" | "Eastern" | "Eastern/Oriental";
  iconUrl: string;
  iconCredit?: SaintIconCredit;
  content: string[];
}