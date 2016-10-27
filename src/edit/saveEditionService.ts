import { Observable } from "rxjs/Observable";
import { RequestsDetailedItemModel } from "../common/models";

/* Save Edition Service  */

export interface ErrorSaveEditionResult {
  kind: "error";
  error: string;
}

export interface SuccessSaveEditionResult {
  kind: "success";
}

export type SaveEditionResult = ErrorSaveEditionResult | SuccessSaveEditionResult;

export type SaveEditionService =
  (item: RequestsDetailedItemModel) => Observable<SaveEditionResult>;
