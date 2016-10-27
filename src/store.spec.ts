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
    defaultRequesterState, createRequesterStore, RequesterActions, RequesterStore, RequesterState, RequesterViewMode
} from "./store";
import { DetailsActions, createDetailsStore } from "./details";
import { ListActions } from "./list";
import { RequestsItemModel, RequestsDetailedItemModel } from "./common/models";

/* DATA */

const withData: RequesterState = {
    detailsStore: null,
    editStore: null,
    listStore: null,
    viewMode: RequesterViewMode.Details,
};
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

/* TESTS */

describe("defaultRequesterState", () => {
    describe("Sanity checks", () => {
        it("Should be a function", () => {
            expect(typeof defaultRequesterState).toBe("function");
        });
    });

    describe("Given no options", () => {
        it("The default state should have default values", () => {
            const state = defaultRequesterState([]);
            expect(state.detailsStore).toBeNull;
            expect(state.editStore).toBeNull;
            expect(state.listStore).not.toBeNull;
            expect(state.viewMode).toBe(RequesterViewMode.List);
        });
    });
});

describe("createRequesterStore", () => {
    describe("Sanity checks", () => {
        it("should be a function", () => expect(typeof createRequesterStore).toBe("function"));
    });

    describe("Initial state testing", () => {
        testLastStateEffects<RequesterState, RequesterStore>("Given a defaultRequesterState", createRequesterStore([]))
            ("When the store receives no actions", "The state should be as expected", [],
            state => {
                expect(state.detailsStore).toEqual(defaultRequesterState([]).detailsStore);
                expect(state.editStore).toEqual(defaultRequesterState([]).editStore);
                expect(typeof state.listStore).toBe("object");
                expect(state.viewMode).toEqual(defaultRequesterState([]).viewMode);
            });

        testLastStateEffects<RequesterState, RequesterStore>("Given an initial state",
            () => createRequesterStore([])({init: withData}))
            ("When the store receives no actions", "The state should be as expected", [],
            state => {
                expect(state.detailsStore).toEqual(withData.detailsStore);
                expect(state.editStore).toEqual(withData.editStore);
                expect(state.listStore).toEqual(withData.listStore);
                expect(state.viewMode).toEqual(withData.viewMode);
            });
    });

    describe("OpenRequest effects", () => {

        describe("Given a requester store when the store receives an Open Request action", () => {
            it("it should dispatch createDetails and setViewMode to the same requester store", () => {
                const store = createRequesterStore([])();
                const promise = store.action$
                    .timeout(400, undefined, queue)
                    .catch(e => Observable.empty<Action>())
                    .takeLast(1)
                    .toArray().toPromise() as PromiseLike<Action[]>;
                store.state$.map(s => s.listStore.dispatch(ListActions.openRequest(item)));
                return promise.then(a => {
                    // expect(a).toEqual([
                    //     RequesterActions.createDetails(createDetailsStore()()),
                    //     RequesterActions.setViewMode(RequesterViewMode.Details)]);
                    return expectAction(a, RequesterActions.setViewMode(RequesterViewMode.Details));
                    });
            });
        });

    //   const openRequestTest = testActionEffects<RequesterState, RequesterStore>("Given a Requester store",
    //     createRequesterStore([]));

    //   openRequestTest("When the store receives no events",
    //     "it should dispatch createDetails, loadItem and setViewMode", [ListActions.openRequest(item)],
    //     actions => {
    //         console.log("ACTIONS!!---> ", actions);
    //         expectAction(actions, RequesterActions.createDetails(createDetailsStore()()));
    //         expectAction(actions, DetailsActions.loadItem(item));
    //         expectAction(actions, RequesterActions.setViewMode(RequesterViewMode.Details));
    //         // expect(actions).toEqual([
    //         //     RequesterActions.createDetails(createDetailsStore()()),
    //         //     DetailsActions.loadItem(item),
    //         //     RequesterActions.setViewMode(RequesterViewMode.Details),
    //         // ]);
    //     }, {
    //         count: 10,
    //         timeout: 400,
    //     });
    });

});
