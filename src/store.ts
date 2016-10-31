import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/observable/merge";
import "rxjs/add/observable/empty";
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

import { ListStore, createListStore, ListActions, LoadHistoryService, LoadNewItemsService } from "./list";
import { DetailsStore, DetailsActions, createDetailsStore, LoadDetailsService, DetailsState } from "./details";
import { EditStore, createEditStore, EditActions, SaveEditionService } from "./edit";
import { RequestsDetailedItemModel, ServiceType } from "./common/models";

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

  createEdit: newEvent.of<EditStore>("CREATE_EDIT", (s, p) =>
    reassign(s, {editStore: p})),
};

/* STORE */

const RequesterReducer = reducerFromActions(RequesterActions);

export type RequesterStore = Store<RequesterState> & RequesterEvents;

export const defaultRequesterState = (
  loadHistoryService: LoadHistoryService,
  loadNewItemsService: LoadNewItemsService
): RequesterState => {
  const listStore = createListStore(loadHistoryService, loadNewItemsService)();
  return {
    viewMode: RequesterViewMode.List,
    listStore,
    detailsStore: null,
    editStore: null,
  };
};

export const openRequestEffects = (loadDetailsService: LoadDetailsService) => (store: RequesterStore) =>
  store.state$
    .switchMap(s => s.listStore ? s.listStore.action$ : Observable.empty<Action>())
    .filter(a => a.type === ListActions.openRequest.type)
    .switchMap(a => {
      const detailsStore = createDetailsStore(loadDetailsService)();
      detailsStore.dispatch(DetailsActions.loadItem(a.payload));
      return Observable.of(
        RequesterActions.createDetails(detailsStore),
        RequesterActions.setViewMode(RequesterViewMode.Details),
        // TODO SET_APP_BAR
      );
    });

const emptyItemGenerator = (n: ServiceType): RequestsDetailedItemModel => {
  return {
      id: "",
      subject: "",
      subtitle: "",
      description: "",
      contactname: "",
      contact: "",
      service: n,
      status: {
          color: "",
          forecolor: "",
          id: "",
          letter: "P",
          name: "Pending",
          systemname: "Pending",
      },
      futureStatus: [],
}; };

export const newRequestEffects = (saveEditionService: SaveEditionService) => (store: RequesterStore) =>
  store.state$
    .switchMap(s => s.listStore ? s.listStore.action$ : Observable.empty<Action>())
    .filter(a => a.type === ListActions.newRequest.type)
    .switchMap(a => {
      const editStore = createEditStore(saveEditionService)();
      editStore.dispatch(EditActions.loadEditItem(emptyItemGenerator(a.payload.serviceType)));
      return Observable.of(
        RequesterActions.createEdit(editStore),
        RequesterActions.setViewMode(RequesterViewMode.Edit),
        // TODO SET_APP_BAR
      );
  });

export const editRequestEffects = (saveEditionService: SaveEditionService) => (store: RequesterStore) =>
  store.state$
    .switchMap(s => s.detailsStore ? s.detailsStore.action$ : Observable.empty<Action>())
    .filter(a => a.type === DetailsActions.editRequest.type)
    .switchMap(a => {
      const editStore = createEditStore(saveEditionService)();
      editStore.dispatch(EditActions.loadEditItem(a.payload));
      return Observable.of(
        RequesterActions.createEdit(editStore),
        RequesterActions.setViewMode(RequesterViewMode.Edit),
        // TODO SET_APP_BAR
      );
  });

export const changeStatusEffects = () => (store: RequesterStore) =>
  store.state$
    .switchMap(s => (s.detailsStore && s.editStore)
      ? s.detailsStore.action$
      : Observable.empty<Action>())
    .filter(action => action.type === DetailsActions.changeStatus.type)
    .switchMap(a => store.state$.switchMap(s => {
      return Observable.of(s.editStore!.dispatch(EditActions.loadNewStatus(a.payload)));
    }));

export const createRequesterStore = (RequesterServices: any[]) => defineStore<RequesterState, RequesterStore>(
  RequesterReducer,
  defaultRequesterState(RequesterServices[0], RequesterServices[1]),
  extendWithActions(RequesterActions),
  withEffects(
    newRequestEffects(RequesterServices[2]),
    editRequestEffects(RequesterServices[2]),
    openRequestEffects(RequesterServices[3]),
  ),
);


