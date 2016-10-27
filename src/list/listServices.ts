import { Observable } from "rxjs/Observable";
import { RequestsItemModel } from "../common/models";

/* Load List History Service  */

export interface ErrorLoadHistoryResult {
  kind: "error";
  error: string;
}

export interface SuccessLoadHistoryResult {
  kind: "success";
  items: RequestsItemModel[];
  totalCount: number;
  hasMore: boolean;
}

export type LoadHistoryResult = ErrorLoadHistoryResult | SuccessLoadHistoryResult;

export type LoadHistoryService =
  (count: number, fromId?: string) => Observable<LoadHistoryResult>;

/* Load New List Items Service */

export interface ErrorLoadNewItemsResult {
  kind: "error";
  error: string;
}

export interface SuccessLoadNewItemsResult {
  kind: "success";
  items: RequestsItemModel[];
}

export type LoadNewItemsResult = ErrorLoadNewItemsResult | SuccessLoadNewItemsResult;

export type LoadNewItemsService =
  (fromId: string) => Observable<LoadNewItemsResult>;
