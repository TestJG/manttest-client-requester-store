import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/observable/concat";
import "rxjs/add/observable/merge";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/catch";
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

import { RequestsItemStatusModel, RequestsDetailedItemModel } from "../common/models";
import { SaveEditionService } from "./saveEditionService";

/* MODELS */

export interface EditState {
  isAvatarButtonOpen: boolean;
  newStatus: RequestsItemStatusModel | null;
  item: RequestsDetailedItemModel | null;
  editable: RequestsDetailedItemModel | null;
  canSave: boolean;
  isSaving: boolean;
  saved: boolean;
};

export interface LoadNewStatusPayload {
  newStatus: RequestsItemStatusModel;
}

/* ACTIONS */

export interface EditEvents {
  toggleAvatarButton(): void;
  loadNewStatus(payload: LoadNewStatusPayload): void;
  cancelNewStatus(): void;
  cancelEdition(): void;
  saveEdition(): void;
}

const newEvent = actionCreator<EditState>("MantTest.Requester.Edit/");

export const EditActions = {
  loadEditItem: newEvent.of<RequestsDetailedItemModel>("LOAD_EDIT_ITEM", (s, p) =>
    reassign(s, {item: p, editable: p})),

  loadNewStatus: newEvent.of<LoadNewStatusPayload>("LOAD_NEW_STATUS", (s, p) =>
    reassignif(!s.newStatus && !!p.newStatus, s, {newStatus: p.newStatus})),

  toggleAvatarButton: newEvent("TOGGLE_AVATAR_BUTTON", s => reassign(s, {isAvatarButtonOpen: !s.isAvatarButtonOpen})),

  cancelNewStatus: newEvent("CANCEL_NEW_STATUS", s => reassignif(!!s.newStatus, s, {newStatus: null})),

  cancelEdition: newEvent("CANCEL_EDITION"),

  canSaveChanged: newEvent.of<boolean>("CAN_SAVE_CHANGED", (s, p) => reassign(s, {canSave: p})),

  saveEdition: newEvent.of<RequestsDetailedItemModel>("SAVE_EDITION"),

  startedSavingEdition: newEvent("STARTED_SAVING_EDITION", s =>
    reassignif(s.isSaving === false, s, {isSaving: true})),

  finishedSavingEdition: newEvent("FINISHED_SAVING_EDITION", s =>
    reassignif(s.isSaving === true, s, {isSaving: false})),

  savedWithSuccess: newEvent("SAVED_WITH_SUCCESS", s => reassign(s, {saved: true})),

  errorLoadingData: newEvent.of<string>("ERROR_LOADING_DATA"),
};

/* STORE */

const EditReducer = reducerFromActions(EditActions);

export type EditStore = Store<EditState> & EditEvents;

export const defaultEditState = (): EditState => ({
  item: null,
  editable: null,
  newStatus: null,
  isAvatarButtonOpen: false,
  canSave: false,
  isSaving: false,
  saved: false,
});

const validationEffects = (store: EditStore) => store.state$
  .map(s => !!s.editable)
  .distinctUntilChanged()
  .map(EditActions.canSaveChanged);

const saveEditionEffects = (saveEditionService: SaveEditionService) => (store: EditStore) => store.update$
  .filter(u => u.action.type === EditActions.saveEdition.type)
  .filter(u => u.state.canSave)
  .switchMap(u =>
    Observable.concat(
      Observable.of(EditActions.startedSavingEdition()),
      saveEditionService(u.state.item)
        .map(r => r.kind === "success"
          ? EditActions.savedWithSuccess()
          : EditActions.errorLoadingData(r.error))
        .catch(e => Observable.of(EditActions.errorLoadingData(e))),
      Observable.of(EditActions.finishedSavingEdition()),
    )
);

export const createEditStore = (
  saveEditionService: SaveEditionService
) => defineStore<EditState, EditStore>(
  EditReducer,
  defaultEditState,
  withEffects(
    validationEffects,
    saveEditionEffects(saveEditionService)),
  extendWithActions(EditActions),
);
