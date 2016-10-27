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
    defaultDetailsState, DetailsActions, DetailsState, createDetailsStore,
    DetailsStore,
} from "./store";
import { RequestsDetailedItemModel } from "../common/models";

describe("defaultDetailsState", () => {
    describe("Sanity checks", () => {
        it("Should be a function", () =>
            expect(typeof defaultDetailsState).toBe("function"));
    });

    describe("Given no options", () => {
        it("The default state should have default values", () => {
            const state = defaultDetailsState();
            expect(state.isAvatarButtonOpen).toEqual(false);
            expect(state.isLoading).toEqual(false);
            expect(state.item).toEqual(null);
        });
    });
});

const init = defaultDetailsState();
const initToggled = reassign(init, { isAvatarButtonOpen: true });
const emptyItem: RequestsDetailedItemModel = {
    id: "",
    subject: "",
    subtitle: "",
    description: "",
    contactname: "",
    contact: "",
    status: null,
    futureStatus: null,
};
const initEmpty = reassign(init, { item: emptyItem });
const nonEmptyItem: RequestsDetailedItemModel = {
    id: "id",
    subject: "subject",
    subtitle: "subtitle",
    description: "description",
    contactname: "contactname",
    contact: "contact",
    status: {
        color: "color",
        forecolor: "forecolor",
        id: "id",
        letter: "letter",
        name: "name",
        systemname: "systemname",
    },
    futureStatus: [{
        color: "color",
        forecolor: "forecolor",
        id: "id",
        letter: "letter",
        name: "name",
        systemname: "systemname",
    }, {
        color: "color",
        forecolor: "forecolor",
        id: "id",
        letter: "letter",
        name: "name",
        systemname: "systemname",
    }],
};

const initNonEmpty = reassign(init, { item: nonEmptyItem });
const emptyNonEmpty = reassign(initEmpty, { item: nonEmptyItem });
const nonEmptyEmpty = reassign(initNonEmpty, { item: emptyItem });

testActions(DetailsActions, "DetailsActions",
    expectedActions<DetailsState>("MantTest.Requester.Details/",
        actions => {
            actions.empty("toggleAvatarButton", "TOGGLE_AVATAR_BUTTON")
                .withSample(init, initToggled)
                .withSample(initToggled, init);

            actions.typed("loadItem", "LOAD_ITEM")
                .withSample(init, null, init)
                .withSample(init, emptyItem, initEmpty)
                .withSample(init, nonEmptyItem, initNonEmpty)
                .withSample(initEmpty, nonEmptyItem, emptyNonEmpty)
                .withSample(initNonEmpty, emptyItem, nonEmptyEmpty)
                .withSample(initNonEmpty, null, init);

            actions.typed("editRequest", "EDIT_REQUEST");

            actions.typed("changeStatus", "CHANGE_STATUS");
        }
    )
);

describe("createDetailsStore", () => {
    describe("Sanity checks", () => {
        it("should be a function", () => expect(typeof createDetailsStore).toBe("function"));
    });

    testLastStateEffects<DetailsState, DetailsStore>(
        "Given a defaultDetailsStore", createDetailsStore())
        ("When the store receives no actions", "The state should be as expected", [],
        state => {
            expect(state.isAvatarButtonOpen).toEqual(defaultDetailsState().isAvatarButtonOpen);
            expect(state.isLoading).toEqual(defaultDetailsState().isLoading);
            expect(state.item).toEqual(defaultDetailsState().item);
        });
});
