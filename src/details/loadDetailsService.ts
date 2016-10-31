import { Observable } from "rxjs/Observable";
import { RequestsDetailedItemModel } from "../common/models";

/* Load List History Service  */

export interface ErrorLoadDetailsResult {
  kind: "error";
  error: string;
}

export interface SuccessLoadDetailsResult {
  kind: "success";
  item: RequestsDetailedItemModel;
}

export type LoadDetailsResult = ErrorLoadDetailsResult | SuccessLoadDetailsResult;

export type LoadDetailsService =
  (id: string) => Observable<LoadDetailsResult>;
