import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/observeOn";
import "rxjs/add/operator/subscribeOn";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/timeout";
import * as deepEqual from "deep-equal";
import {
  reassign, reassignif,
  actionCreator, TypedActionDescription, EmptyActionDescription,
  reducerFromActions, Reducer, StateUpdate,
  createStore, Store, StoreMiddleware,
  withEffects, defineStore, ICreateStoreOptions, logUpdates,
  tunnelActions, extendWithActions, extendWith,
} from "rxstore";

import { ListStore } from "./list";
import { DetailsStore } from "./details";
import { EditStore } from "./edit";

/* MODELS */

export interface RequesterState {
  viewMode: RequesterViewMode;

  listStore: ListStore;
  detailsStore: DetailsStore | null;
  editStore: EditStore | null;
}

export enum RequesterViewMode {
  List = 0,
  Details = 1,
  Edit = 2,
};

/* ACTIONS */


