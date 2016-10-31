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

import { RequestsDetailedItemModel, RequestsItemStatusModel, RequestsItemModel } from "../common/models";
import { LoadDetailsService } from "./loadDetailsService";

/* MODELS */

export interface DetailsState {
  isAvatarButtonOpen: boolean;
  isLoading: boolean;
  item: RequestsDetailedItemModel | null;
}

export interface ChangeStatusPayload {
  newStatus: RequestsItemStatusModel;
}

/* ACTIONS */

export interface DetailsEvents {
  toggleAvatarButton(): void;
  editRequest(item: RequestsDetailedItemModel): void;
  changeStatus(newStatus: RequestsItemStatusModel): void;
}

const newEvent = actionCreator<DetailsState>("MantTest.Requester.Details/");

export const DetailsActions = {
  toggleAvatarButton: newEvent("TOGGLE_AVATAR_BUTTON", s => reassign(s, {isAvatarButtonOpen: !s.isAvatarButtonOpen})),

  loadItem: newEvent.of<RequestsItemModel>("LOAD_ITEM", (s, p) => {
    if (!p) { return reassign(s, {item: null}); };
    return reassign(s, {item: {
      id: p.id,
      subject: p.subject,
      subtitle: p.subtitle,
      status: p.status,
    }}); } ),

  startedLoadingDetails: newEvent("STARTED_LOADING_DETAILS", s => reassign(s, {isLoading: true})),

  loadDetails: newEvent.of<RequestsDetailedItemModel>("LOAD_DETAILS", (s, p) => {
    if (!p) { return reassign(s, {item: null}); };
    return reassign(s, {item: {
      id: p.id,
      subject: p.subject,
      subtitle: p.subtitle,
      description: p.description,
      contactname: p.contactname,
      contact: p.contact,
      status: p.status,
      futureStatus: p.futureStatus,
      service: p.service,
    }}); } ),

  finishedLoadingDetails: newEvent("FINISHED_LOADING_DETAILS", s => reassign(s, {isLoading: false})),

  errorLoadingData: newEvent.of<string>("ERROR_LOADING_DATA"),

  editRequest: newEvent.of<RequestsDetailedItemModel>("EDIT_REQUEST"),

  changeStatus: newEvent.of<ChangeStatusPayload>("CHANGE_STATUS"),
};

/* STORE */

const DetailsReducer = reducerFromActions(DetailsActions);

export type DetailsStore = Store<DetailsState> & DetailsEvents;

export const LoadDetailsEffects = (loadDetailsService: LoadDetailsService) => (store: DetailsStore) =>
  store.update$
    .filter(u => u.action.type === DetailsActions.loadItem.type)
    .filter(u => u.state.isLoading === false)
    .switchMap(u =>
      Observable.concat(
        Observable.of(DetailsActions.startedLoadingDetails()),
        loadDetailsService(u.state.item!.id)
          .map(r => r.kind === "success"
            ? DetailsActions.loadDetails(r.item)
            : DetailsActions.errorLoadingData(r.error)),
        Observable.of(DetailsActions.finishedLoadingDetails),
      )
    );

export const defaultDetailsState = (): DetailsState => ({
  isAvatarButtonOpen: false,
  isLoading: false,
  item: null,
});

export const createDetailsStore = (
  loadDetailsService: LoadDetailsService,
) =>
    defineStore<DetailsState, DetailsStore>(
      DetailsReducer,
      defaultDetailsState,
      extendWithActions(DetailsActions),
      withEffects(LoadDetailsEffects(loadDetailsService)),
      tunnelActions({
        actions: {
          changeStatus: (a: Action) => DetailsActions.editRequest(a.payload.item),
        },
        dispatchFactory: (s: DetailsStore) => s.dispatch,
      })
    );
