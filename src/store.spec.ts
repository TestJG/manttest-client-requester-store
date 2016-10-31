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
import { DetailsActions, createDetailsStore, DetailsState } from "./details";
import { EditState, createEditStore, EditActions } from "./edit";
import { ListActions } from "./list";
import { RequestsItemModel, RequestsDetailedItemModel, ServiceType, RequestsItemStatusModel } from "./common/models";

/* DATA */

const serviceEmptyMock = jest.fn(() => null);

const withData: RequesterState = {
    detailsStore: null,
    editStore: null,
    listStore: null,
    viewMode: RequesterViewMode.Details,
};
const withDetails: RequesterState = {
    detailsStore: createDetailsStore(() => Observable.empty())(),
    editStore: null,
    listStore: null,
    viewMode: RequesterViewMode.Details,
};
const withDetailsAndEdit: RequesterState = {
    detailsStore: createDetailsStore(() => Observable.empty())(),
    editStore: createEditStore(() => Observable.empty())(),
    listStore: null,
    viewMode: RequesterViewMode.Edit,
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
const emptyStatus: RequestsItemStatusModel = {
    color: "",
    forecolor: "",
    id: "",
    letter: "",
    name: "",
    systemname: "",
};
const emptyDetailItem: RequestsDetailedItemModel = {
    id: "",
    subject: "",
    subtitle: "",
    description: "",
    contactname: "",
    contact: "",
    service: null,
    status: emptyStatus,
    futureStatus: [],
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
            const state = defaultRequesterState(serviceEmptyMock, serviceEmptyMock);
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
                expect(state.detailsStore)
                    .toEqual(defaultRequesterState(serviceEmptyMock, serviceEmptyMock).detailsStore);
                expect(state.editStore).toEqual(defaultRequesterState(serviceEmptyMock, serviceEmptyMock).editStore);
                expect(typeof state.listStore).toBe("object");
                expect(state.viewMode).toEqual(defaultRequesterState(serviceEmptyMock, serviceEmptyMock).viewMode);
            });

        testLastStateEffects<RequesterState, RequesterStore>("Given an initial state",
            () => createRequesterStore([])({ init: withData }))
            ("When the store receives no actions", "The state should be as expected", [],
            state => {
                expect(state.detailsStore).toEqual(withData.detailsStore);
                expect(state.editStore).toEqual(withData.editStore);
                expect(state.listStore).toEqual(withData.listStore);
                expect(state.viewMode).toEqual(withData.viewMode);
            });
    });

    describe("OpenRequest effects", () => {
        describe("Given a requester store when its details store dispatches an Open Request action", () => {
            it("it should dispatch createDetails and setViewMode(DetailsView) to the same requester store", () => {
                const store = createRequesterStore([null, null, null, () => Observable.empty<Action>()])();
                const promise = store.action$
                    .timeout(40, undefined, queue)
                    .catch(e => Observable.empty<Action>())
                    .takeLast(2)
                    .toArray().toPromise() as PromiseLike<Action[]>;
                store.state$
                    .first()
                    .subscribe(s => s.listStore.dispatch(ListActions.openRequest(item)));
                return promise.then(a => {
                    expect(a.length).toEqual(2);
                    expect(a[0].type).toEqual(RequesterActions.createDetails.type);
                    expect(a[1]).toEqual(RequesterActions.setViewMode(RequesterViewMode.Details));
                });
            });

            it("it should dispatch a loadItem to details store (item is not null)", () => {
                const store = createRequesterStore([null, null, null, () => Observable.empty<Action>()])();
                const promise = store.state$
                    .switchMap(s => s.detailsStore ? s.detailsStore.state$ : Observable.empty<DetailsState>())
                    .timeout(40, undefined, queue)
                    .catch(e => Observable.empty<DetailsState>())
                    .takeLast(1)
                    .toArray()
                    .toPromise() as PromiseLike<DetailsState[]>;
                store.state$
                    .first()
                    .subscribe(s => s.listStore.dispatch(ListActions.openRequest(item)));
                return promise.then(s => {
                    expect(s[0].item).not.toBeNull();
                    expect(s[0].item.id).toEqual("string");
                });
            });
        });
    });

    describe("NewRequest effects", () => {
        describe("Given a requester store when its list store dispatches a New Request action", () => {
            it("it should dispatch createEdit and setViewMode(EditView) to the same requester store", () => {
                const store = createRequesterStore([])();
                const promise = store.action$
                    .timeout(40, undefined, queue)
                    .catch(e => Observable.empty<Action>())
                    .takeLast(2)
                    .toArray().toPromise() as PromiseLike<Action[]>;
                store.state$
                    .first()
                    .subscribe(s =>
                        s.listStore.dispatch(ListActions.newRequest({ serviceType: ServiceType.Gardening })));
                return promise.then(a => {
                    expect(a.length).toEqual(2);
                    expect(a[0].type).toEqual(RequesterActions.createEdit.type);
                    expect(a[1]).toEqual(RequesterActions.setViewMode(RequesterViewMode.Edit));
                });
            });

            it("it should dispatch a loadEditItem to edit store (item has a service type)", () => {
                const store = createRequesterStore([])();
                const promise = store.state$
                    .switchMap(s => s.editStore ? s.editStore.state$ : Observable.empty<EditState>())
                    .timeout(40, undefined, queue)
                    .catch(e => Observable.empty<EditState>())
                    .takeLast(1)
                    .toArray().toPromise() as PromiseLike<EditState[]>;
                store.state$
                    .first()
                    .subscribe(s =>
                        s.listStore.dispatch(ListActions.newRequest({ serviceType: ServiceType.Gardening })));
                return promise.then(s => {
                    expect(s[0].item).not.toBeNull();
                    expect(s[0].item.service).toEqual(ServiceType.Gardening);
                });
            });
        });
    });

    describe("EditRequest Effects", () => {
        describe("Given a requester store when its details store dispatches an Edit Request action", () => {
            it("it should dispatch a createEdit and setViewMode(EditView) to the same requester store", () => {
                const store = createRequesterStore([])({ init: withDetails });
                const promise = store.action$
                    .timeout(40, undefined, queue)
                    .catch(e => Observable.empty<Action>())
                    .takeLast(2)
                    .toArray().toPromise() as PromiseLike<Action[]>;
                store.state$
                    .first()
                    .subscribe(s => s.detailsStore.dispatch(DetailsActions.editRequest(emptyDetailItem)));
                return promise.then(a => {
                    expect(a.length).toEqual(2);
                    expect(a[0].type).toEqual(RequesterActions.createEdit.type);
                    expect(a[1]).toEqual(RequesterActions.setViewMode(RequesterViewMode.Edit));
                });
            });

            it("it should dispatch a loadEditItem to edit store (item is the same that was on details)", () => {
                const store = createRequesterStore([])({ init: withDetails });
                const promise = store.state$
                    .switchMap(s => s.editStore ? s.editStore.state$ : Observable.empty<EditState>())
                    .timeout(40, undefined, queue)
                    .catch(e => Observable.empty<EditState>())
                    .takeLast(1)
                    .toArray().toPromise() as PromiseLike<EditState[]>;
                store.state$
                    .first()
                    .subscribe(s => s.detailsStore.dispatch(DetailsActions.editRequest(emptyDetailItem)));
                return promise.then(s => {
                    expect(s[0].item).not.toBeNull();
                    expect(s[0].item).toEqual(emptyDetailItem);
                });
            });
        });
    });

    describe("Change status Effects", () => {
        describe("Given a requester store when its details store dispatches a Change Status action", () => {
            it("it should dispatch a loadNewStatus to edit store", () => {
                const store = createRequesterStore([])({ init: withDetailsAndEdit });
                const promise = store.state$
                    .switchMap(s => s.editStore ? s.editStore.state$ : Observable.empty<EditState>())
                    .timeout(40, undefined, queue)
                    .catch(e => Observable.empty<EditState>())
                    .takeLast(1)
                    .toArray().toPromise() as PromiseLike<EditState[]>;
                store.state$
                    .first()
                    .subscribe(s => s.detailsStore
                        .dispatch(DetailsActions.changeStatus({newStatus: emptyStatus})));
                return promise.then(s => {
                    console.log("NEWSTATUS---->", s[0]);
                    expect(s[0].newStatus).not.toBeNull();
                    expect(s[0].newStatus).toEqual(emptyStatus);
                });
            });
        });

    });
});
