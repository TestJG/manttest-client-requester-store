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
  tunnelActions, extendWithActions, extendWith, Action,
} from "rxstore";

import { ListStore, createListStore, ListActions } from "./list";
import { DetailsStore, DetailsActions, createDetailsStore } from "./details";
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

export interface RequesterEvents {}

const newEvent = actionCreator<RequesterState>("MantTest.Requester/");

export const RequesterActions = {
  setViewMode: newEvent.of<RequesterViewMode>("SET_VIEW_MODE", (s, p) =>
    reassignif(s.viewMode !== p, s, {viewMode: p})),

  createDetails: newEvent.of<DetailsStore>("CREATE_DETAILS", (s, p) =>
    reassign(s, {detailsStore: p})),
};

/* STORE */

const RequesterReducer = reducerFromActions(RequesterActions);

export type RequesterStore = Store<RequesterState> & RequesterEvents;

export const defaultRequesterState = (RequesterServices: any[]): RequesterState => {
  const listStore = createListStore(RequesterServices[0], RequesterServices[1])();
  return {
    viewMode: RequesterViewMode.List,
    listStore,
    detailsStore: null,
    editStore: null,
  };
};

export const openRequestEffects = (store: RequesterStore) =>
  store.state$
    .filter(s => !!s.listStore)
    .switchMap(s => s.listStore.action$)
    .filter(a => a.type === ListActions.openRequest.type)
    .switchMap(a => {
      const detailsStore = createDetailsStore()();
      detailsStore.dispatch(DetailsActions.loadItem(a.payload));
      return Observable.concat(
        Observable.of(RequesterActions.createDetails(detailsStore)),
        Observable.of(RequesterActions.setViewMode(RequesterViewMode.Details)),
        // SET_APP_BAR
      );
    });

export const createRequesterStore = (RequesterServices: any[]) => defineStore<RequesterState, RequesterStore>(
  RequesterReducer,
  defaultRequesterState(RequesterServices),
  extendWithActions(RequesterActions),
  withEffects(
    openRequestEffects,
  ),
);


