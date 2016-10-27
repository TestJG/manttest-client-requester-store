
export interface RequestsDetailedItemModel {
  id: string;
  subject: string;
  subtitle: string;
  description: string;
  contactname: string;
  contact: string;
  // issuetype: RequestsItemReference | null;
  // zone: RequestsItemReference | null;
  status: RequestsItemStatusModel;
  futureStatus: RequestsItemStatusModel[] | null;
  // photos: PhotoDescription[];
  // logs: RequestsItemLogs[];
}

export interface RequestsItemStatusModel {
  letter: string;
  name: string;
  color: string;
  forecolor: string;
  systemname: string;
  id: string;
}

export interface RequestsItemModel {
  id: string;
  subject: string;
  subtitle: string;
  status: RequestsItemStatusModel;
}

export type ServiceType = "Maintenance" | "Gardening" | "Cleaning";
