"use strict";

import "jest";
require("babel-core/register");
require("babel-polyfill");
import { Observable } from "rxjs/Observable";
import { queue } from "rxjs/scheduler/queue";
import "rxjs/add/observable/concat";
import "rxjs/add/observable/empty";
import "rxjs/add/observable/of";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/concat";
import "rxjs/add/operator/delay";
import "rxjs/add/operator/do";
import "rxjs/add/operator/first";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/last";
import "rxjs/add/operator/map";
import "rxjs/add/operator/observeOn";
import "rxjs/add/operator/subscribeOn";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/takeLast";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/toPromise";

import * as deepEqual from "deep-equal";

import {
    reassign, Store, Action, StoreActions, logUpdates, startEffects,
    tunnelActions, ActionTunnel,
} from "rxstore";
import { testActions, expectedActions } from "rxstore-jest";
import {
    testUpdateEffects, testActionEffects, testStateEffects,
    expectAction, expectItem, testLastStateEffects,
} from "rxstore-jest";

import {
    defaultListState, ListActions, ListState, AddHistoricItemsPayload, createListStore, ListStore,
    LoadHistoryResult, AddNewItemsPayload, LoadNewItemsResult,
} from "./index";
import { RequestsItemModel } from "../common/models";

/* DATA */

const init = defaultListState();
const initStarted = reassign(init, { isLoadingHistory: true });
const initNewItemsStarted = reassign(init, { isLoadingNewItems: true });
const item: RequestsItemModel = {
    id: "string",
    subject: "string",
    subtitle: "string",
    status: {
        letter: "string",
        name: "string",
        color: "string",
        forecolor: "string",
        systemname: "string",
        id: "string",
    },
};
const item2: RequestsItemModel = {
    id: "string",
    subject: "string",
    subtitle: "string",
    status: {
        letter: "string",
        name: "string",
        color: "string",
        forecolor: "string",
        systemname: "string2",
        id: "string",
    },
};
const addItems: AddHistoricItemsPayload = {
    items: [item, item],
    hasMore: true,
    totalItemCount: 3,
};
const addNothing: AddHistoricItemsPayload = {
    items: [],
    hasMore: false,
    totalItemCount: 0,
};
const initAddItems = reassign(init, {
    items: addItems.items, hasMoreHistory: addItems.hasMore, totalItemCount: addItems.totalItemCount,
});
const initAddItems2 = reassign(initAddItems, {items: [...initAddItems.items, item2]});
const addNewItems: AddNewItemsPayload = {items: [item, item]};
const addNoNewItems: AddNewItemsPayload = {items: []};
const initAddNewItems = reassign(init, {items: addNewItems.items});
const initAddNewItem2 = reassign(initAddNewItems, {items: [item2, ...initAddNewItems.items]});
const initToggled = reassign(init, { isAddButtonOpen: true });
const twoitems = reassign(initAddItems, { items: [item, item2] });
const twoitems1 = reassign(twoitems, { filteredItems: [item] });
const twoitems2 = reassign(twoitems, { filteredItems: [item2] });
const itemsFiltered = reassign(initAddItems, { filteredItems: [item, item] });
const withData: ListState = {
    items: [item, item2],
    filteredItems: [item2],
    hasMoreHistory: true,
    isAddButtonOpen: true,
    isLoadingHistory: true,
    isLoadingNewItems: true,
    totalItemCount: 1,
};
const errorMessage = "some error";

/* TESTS */

describe("defaultListState", () => {
    describe("Sanity checks", () => {
        it("it should be a function", () =>
            expect(typeof defaultListState).toEqual("function"));
    });

    describe("Given the default state", () => {
        it("it should be equal to expected state", () =>
            expect(defaultListState()).toEqual({
                items: [],
                totalItemCount: 0,
                isLoadingHistory: false,
                isLoadingNewItems: false,
                hasMoreHistory: false,
                isAddButtonOpen: false,
                filteredItems: [],
            }));
    });
});

testActions(ListActions, "ListActions",
    expectedActions<ListState>("MantTest.Requester.List/",
        actions => {
            actions.typed("loadHistory", "LOAD_HISTORY");

            actions.empty("startedLoadingHistory", "STARTED_LOADING_HISTORY")
                .withSample(init, initStarted)
                .withSample(initStarted, initStarted);

            actions.typed("addHistoricItems", "ADD_HISTORIC_ITEMS")
                .withSample(init, addItems, initAddItems)
                .withSample(init, addNothing, init)
                .withSample(initAddItems, {items: [item2], hasMore: true, totalItemCount: 3}, initAddItems2);

            actions.empty("finishedLoadingHistory", "FINISHED_LOADING_HISTORY")
                .withSample(initStarted, init)
                .withSample(init, init);

            actions.typed("loadNewItems", "LOAD_NEW_ITEMS");

            actions.empty("startedLoadingNewItems", "STARTED_LOADING_NEW_ITEMS")
                .withSample(init, initNewItemsStarted)
                .withSample(initNewItemsStarted, initNewItemsStarted);

            actions.typed("addNewItems", "ADD_NEW_ITEMS")
                .withSample(init, addNewItems, initAddNewItems)
                .withSample(init, addNoNewItems, init)
                .withSample(initAddNewItems, {items: [item2]}, initAddNewItem2);

            actions.empty("finishedLoadingNewItems", "FINISHED_LOADING_NEW_ITEMS")
                .withSample(initNewItemsStarted, init)
                .withSample(init, init);

            actions.typed("errorLoadingData", "ERROR_LOADING_DATA");

            actions.typed("newRequest", "NEW_REQUEST");

            actions.typed("openRequest", "OPEN_REQUEST");

            actions.empty("toggleAddButton", "TOGGLE_ADD_BUTTON")
                .withSample(init, initToggled)
                .withSample(initToggled, init);

            actions.typed("filterByStatus", "FILTER_BY_STATUS")
                .withSample(init, "", init)
                .withSample(initAddItems, "", initAddItems)
                .withSample(initAddItems, "string", itemsFiltered)
                .withSample(twoitems, "string", twoitems1)
                .withSample(twoitems, "string2", twoitems2);

            actions.empty("cleanFilters", "CLEAN_FILTERS")
                .withSample(init, init)
                .withSample(itemsFiltered, initAddItems)
                .withSample(twoitems1, twoitems)
                .withSample(twoitems2, twoitems);
        }
    ));

describe("createListStore", () => {
    const serviceEmptyMock = jest.fn(() => null);

    describe("Sanity checks", () => {
        it("should be a function", () => expect(typeof createListStore).toBe("function"));
    });

    describe("Initial state testing", () => {
        testLastStateEffects<ListState, ListStore>(
            "Given a defaultDetailsStore", createListStore(serviceEmptyMock, serviceEmptyMock))
            ("When the store receives no actions", "The state should be default", [],
            state => {
                expect(state).toEqual(defaultListState());
                expect(state.filteredItems).toEqual(defaultListState().filteredItems);
                expect(state.hasMoreHistory).toEqual(defaultListState().hasMoreHistory);
                expect(state.isAddButtonOpen).toEqual(defaultListState().isAddButtonOpen);
                expect(state.isLoadingHistory).toEqual(defaultListState().isLoadingHistory);
                expect(state.items).toEqual(defaultListState().items);
                expect(state.totalItemCount).toEqual(defaultListState().totalItemCount);
            });

        testLastStateEffects<ListState, ListStore>(
            "Given an initial state", () => createListStore(serviceEmptyMock, serviceEmptyMock)({init: withData})
            )("When the store receives no actions", "The state should be the given state", [],
                state => {
                    expect(state).toEqual(withData);
                    expect(state.filteredItems).toEqual(withData.filteredItems);
                    expect(state.hasMoreHistory).toEqual(withData.hasMoreHistory);
                    expect(state.isAddButtonOpen).toEqual(withData.isAddButtonOpen);
                    expect(state.isLoadingHistory).toEqual(withData.isLoadingHistory);
                    expect(state.items).toEqual(withData.items);
                    expect(state.totalItemCount).toEqual(withData.totalItemCount);
                });
    });

    describe("Load History Effects", () => {
        const successLoadHistoryMockService = (delay: number = 40) =>
            jest.fn<Observable<LoadHistoryResult>>(() =>
                Observable
                    .of<LoadHistoryResult>({
                        kind: "success",
                        items: [],
                        totalCount: 0,
                        hasMore: false,
                    })
                    .delay(delay, queue));

        const errorLoadHistoryMockService = (delay: number = 40) =>
            jest.fn<Observable<LoadHistoryResult>>(() =>
                Observable
                    .of<LoadHistoryResult>({
                        kind: "error",
                        error: errorMessage })
                    .delay(delay, queue));

        const successTester = testActionEffects<ListState, ListStore>(
            "Given a List store with success results",
            () => createListStore(successLoadHistoryMockService(0), serviceEmptyMock)());

        const errorTester = testActionEffects<ListState, ListStore>(
            "Given a List store with error results",
            () => createListStore(errorLoadHistoryMockService(0), serviceEmptyMock)());

        successTester("When the store receives a load history command under succesful conditions",
            "it should dispatch startedLoadingHistory, addHistoricItems and finishedLoadingHistory actions",
            [ListActions.loadHistory({count: 20})],
            actions => {
                expectAction(actions, ListActions.startedLoadingHistory());
                expectAction(actions, ListActions.addHistoricItems({hasMore: false, items: [], totalItemCount: 0}));
                expectAction(actions, ListActions.startedLoadingHistory());
            }, {
                count: 3,
            }
        );

        errorTester("When the store receives a load history command under failure conditions",
            "it should dispatch startedLoadingHistory, errorLoadingData and finishedLoadingHistory actions",
            [ListActions.loadHistory({count: 20})],
            actions => {
                expectAction(actions, ListActions.startedLoadingHistory());
                expectAction(actions, ListActions.errorLoadingData(errorMessage));
                expectAction(actions, ListActions.startedLoadingHistory());
            }, {
                count: 3,
            },
        );

    });

    describe("Load New Items Effects", () => {
      const successLoadNewItemsMockService = (delay: number = 40) =>
        jest.fn<Observable<LoadNewItemsResult>>(() =>
            Observable.of<LoadNewItemsResult>({kind: "success", items: []}).delay(delay, queue));

      const errorLoadNewItemsMockService = (delay: number = 40) =>
        jest.fn<Observable<LoadNewItemsResult>>(() =>
            Observable.of<LoadNewItemsResult>({kind: "error", error: errorMessage}).delay(delay, queue));

      const successTester = testActionEffects<ListState, ListStore>(
          "Given a List store with success results",
          () => createListStore(serviceEmptyMock(), successLoadNewItemsMockService(0))());

      const errorTester = testActionEffects<ListState, ListStore>(
          "Given a List store with error results",
          () => createListStore(serviceEmptyMock(), errorLoadNewItemsMockService(0))());

      successTester("When the store receives a load new items command under succesful conditions",
          "it should dispatch startedLoadingNewItems, addNewItems and finishedLoadingNewItems actions",
          [ListActions.loadNewItems({fromId: "20"})],
          actions => {
              expectAction(actions, ListActions.startedLoadingNewItems());
              expectAction(actions, ListActions.addNewItems({items: []}));
              expectAction(actions, ListActions.finishedLoadingNewItems());
          }, {
              count: 3,
          }
      );

      errorTester("When the store receives a load new items command under failure conditions",
          "it should dispatch startedLoadingNewItems, errorLoadingData and finishedLoadingNewItems actions",
          [ListActions.loadNewItems({fromId: "20"})],
          actions => {
              expectAction(actions, ListActions.startedLoadingNewItems());
              expectAction(actions, ListActions.errorLoadingData(errorMessage));
              expectAction(actions, ListActions.finishedLoadingNewItems());
          }, {
              count: 3,
          },
      );
    });

});
