import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/observable/concat";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/catch";
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

import { RequestsItemModel, ServiceType } from "../common/models";
import { LoadHistoryService, LoadNewItemsService } from "./listServices";

/* MODELS */

export interface ListState {
  items: RequestsItemModel[];
  totalItemCount: number;
  isLoadingHistory: boolean;
  isLoadingNewItems: boolean;
  hasMoreHistory: boolean;
  isAddButtonOpen: boolean;
  filteredItems: RequestsItemModel[];
}

export interface LoadHistoryPayload {
  fromId?: string;
  count: number;
}

export interface LoadNewItemsPayload {
  fromId: string;
}

export interface AddHistoricItemsPayload {
  items: RequestsItemModel[];
  totalItemCount: number;
  hasMore: boolean;
}

export interface AddNewItemsPayload {
  items: RequestsItemModel[];
}

export interface NewRequestPayload {
  serviceType: ServiceType;
}


/* ACTIONS */

export interface ListEvents {
    loadHistory(payload: LoadHistoryPayload): void;
    newRequest(payload: NewRequestPayload): void;
    openRequest(payload: RequestsItemModel): void;
    toggleAddButton(): void;
}

const newEvent = actionCreator<ListState>("MantTest.Requester.List/");

export const ListActions = {
    loadHistory: newEvent.of<LoadHistoryPayload>("LOAD_HISTORY"),

    startedLoadingHistory: newEvent("STARTED_LOADING_HISTORY", s =>
        reassignif(!s.isLoadingHistory, s, {isLoadingHistory: true})),

    addHistoricItems: newEvent.of<AddHistoricItemsPayload>("ADD_HISTORIC_ITEMS",
        (s, p) => reassign(s, {
            items: [ ...s.items, ...p.items ],
            totalItemCount: p.totalItemCount,
            hasMoreHistory: p.hasMore,
    })),

    finishedLoadingHistory: newEvent("FINISHED_LOADING_HISTORY", s =>
        reassignif(s.isLoadingHistory, s, {isLoadingHistory: false})),

    loadNewItems: newEvent.of<LoadNewItemsPayload>("LOAD_NEW_ITEMS"),

    startedLoadingNewItems: newEvent("STARTED_LOADING_NEW_ITEMS", s =>
        reassignif(!s.isLoadingNewItems, s, {isLoadingNewItems: true})),

    addNewItems: newEvent.of<AddNewItemsPayload>("ADD_NEW_ITEMS", (s, p) =>
        reassign(s, {items: [ ...p.items, ...s.items ]})),

    finishedLoadingNewItems: newEvent("FINISHED_LOADING_NEW_ITEMS", s =>
        reassignif(s.isLoadingNewItems, s, {isLoadingNewItems: false})),

    errorLoadingData: newEvent.of<string>("ERROR_LOADING_DATA"),

    newRequest: newEvent.of<NewRequestPayload>("NEW_REQUEST"),

    openRequest: newEvent.of<RequestsItemModel>("OPEN_REQUEST"),

    toggleAddButton: newEvent("TOGGLE_ADD_BUTTON", s => reassign(s, {isAddButtonOpen: !s.isAddButtonOpen})),

    filterByStatus: newEvent.of<string>("FILTER_BY_STATUS", (s, p) =>
        reassign(s, {filteredItems: s.items.filter(i => i.status.systemname === p)})),

    cleanFilters: newEvent("CLEAN_FILTERS", s => reassignif(!!s.filteredItems, s, {filteredItems: []})),
};

/* STORE */

const ListReducer = reducerFromActions(ListActions);

export type ListStore = Store<ListState> & ListEvents;

export const defaultListState = (): ListState => ({
  items: [],
  totalItemCount: 0,
  hasMoreHistory: false,
  isLoadingHistory: false,
  isLoadingNewItems: false,
  isAddButtonOpen: false,
  filteredItems: [],
});

const loadHistoryEffects =
    (loadHistoryService: LoadHistoryService) =>
        (store: ListStore) => store.update$
            .filter(u => u.action.type === ListActions.loadHistory.type)
            .filter(u => !u.state.isLoadingHistory)
            .switchMap(u =>
                Observable.concat(
                    Observable.of(ListActions.startedLoadingHistory()),
                    loadHistoryService(u.action.payload.count, u.action.payload.fromId)
                        .map(r => r.kind === "success"
                            ? ListActions.addHistoricItems({
                                totalItemCount: r.totalCount,
                                items: r.items,
                                hasMore: r.hasMore })
                            : ListActions.errorLoadingData(r.error))
                        .catch(e => Observable.of(ListActions.errorLoadingData(e))),
                    Observable.of(ListActions.finishedLoadingHistory()),
                )
            );

const loadNewItemsEffects =
    (loadNewItemsService: LoadNewItemsService) =>
        (store: ListStore) => store.update$
            .filter(u => u.action.type === ListActions.loadNewItems.type)
            .filter(u => !u.state.isLoadingNewItems)
            .switchMap(u =>
                Observable.concat(
                    Observable.of(ListActions.startedLoadingNewItems()),
                    loadNewItemsService(u.action.payload.fromId)
                        .map(r => r.kind === "success"
                            ? ListActions.addNewItems({ items: r.items})
                            : ListActions.errorLoadingData(r.error))
                        .catch(e => Observable.of(ListActions.errorLoadingData(e))),
                    Observable.of(ListActions.finishedLoadingNewItems()),
                )
            );

export const createListStore = (
    loadHistoryService: LoadHistoryService,
    loadNewItemsService: LoadNewItemsService,
) =>
    defineStore<ListState, ListStore>(
      ListReducer,
      defaultListState,
      withEffects(
          loadHistoryEffects(loadHistoryService),
          loadNewItemsEffects(loadNewItemsService),
      ),
      extendWithActions(ListActions)
    );

