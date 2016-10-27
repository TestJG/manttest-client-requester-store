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

import { defaultEditState, EditActions, EditState, createEditStore, EditStore } from "./store";
import { RequestsDetailedItemModel } from "../common/models";
import { SaveEditionResult, SaveEditionService } from "./saveEditionService":

/* DATA */

const init = defaultEditState();
const emptyItem: RequestsDetailedItemModel = {
    id: "",
    subject: "",
    subtitle: "",
    description: "",
    contactname: "",
    contact: "",
    service: null,
    status: {
        color: "",
        forecolor: "",
        id: "",
        letter: "",
        name: "",
        systemname: "",
    },
    futureStatus: [],
};
const initEmpty = reassign(init, {item: emptyItem, editable: emptyItem});
const nonEmptyItem: RequestsDetailedItemModel = {
    id: "id",
    subject: "subject",
    subtitle: "subtitle",
    description: "description",
    contactname: "contactname",
    contact: "contact",
    service: "Gardening",
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
const initNonEmpty = reassign(init, { item: nonEmptyItem, editable: nonEmptyItem });
const emptyNonEmpty = reassign(initEmpty, { item: nonEmptyItem, editable: nonEmptyItem });
const nonEmptyEmpty = reassign(initNonEmpty, { item: emptyItem, editable: emptyItem });
const newStatus = {
        color: "string",
        forecolor: "string",
        id: "string",
        letter: "string",
        name: "string",
        systemname: "string",
};
const newStatus2 = {
        color: "string2",
        forecolor: "string2",
        id: "string2",
        letter: "string2",
        name: "string2",
        systemname: "string2",
};
const initNewStatus = reassign(init, {newStatus: newStatus});
const withData: EditState = {
    canSave: true,
    editable: nonEmptyItem,
    isAvatarButtonOpen: true,
    isSaving: true,
    item: nonEmptyItem,
    newStatus: newStatus,
    saved: true,
};
const errorMessage = "some error";

/* TESTS */

describe("defaultEditState", () => {
    describe("Sanity checks", () => {
        it("Should be a function", () => {
            expect(typeof defaultEditState).toBe("function");
        });
    });

    describe("Given no options", () => {
        it("The default state should have default values", () => {
            const state = defaultEditState();
            expect(state.canSave).toBeFalsy;
            expect(state.editable).toBeUndefined;
            expect(state.isAvatarButtonOpen).toBeFalsy;
            expect(state.isSaving).toBeFalsy;
            expect(state.item).toBeUndefined;
            expect(state.newStatus).toBeNull;
            expect(state.saved).toBeFalsy;
        });
    });
});

testActions(EditActions, "EditActions",
    expectedActions<EditState>("MantTest.Requester.Edit/",
        actions => {
            actions.typed("loadEditItem", "LOAD_EDIT_ITEM")
                .withSample(init, null, init)
                .withSample(init, emptyItem, initEmpty)
                .withSample(init, nonEmptyItem, initNonEmpty)
                .withSample(initEmpty, nonEmptyItem, emptyNonEmpty)
                .withSample(initNonEmpty, emptyItem, nonEmptyEmpty)
                .withSample(initNonEmpty, null, init);

            actions.typed("loadNewStatus", "LOAD_NEW_STATUS")
                .withSample(init, {newStatus: null}, init)
                .withSample(init, {newStatus: newStatus}, initNewStatus)
                .withSample(initNewStatus, newStatus2, initNewStatus);

            actions.empty("toggleAvatarButton", "TOGGLE_AVATAR_BUTTON")
                .withSample(init, reassign(init, {isAvatarButtonOpen: !init.isAvatarButtonOpen}))
                .withSample(reassign(init, {isAvatarButtonOpen: !init.isAvatarButtonOpen}), init);

            actions.empty("cancelNewStatus", "CANCEL_NEW_STATUS")
                .withSample(init, init)
                .withSample(initNewStatus, init);

            actions.empty("cancelEdition", "CANCEL_EDITION");

            actions.typed("canSaveChanged", "CAN_SAVE_CHANGED")
                .withSample(init, false, init)
                .withSample(init, true, reassign(init, {canSave: true}))
                .withSample(reassign(init, {canSave: true}), false, init)
                .withSample(reassign(init, {canSave: true}), true, reassign(init, {canSave: true}));

            actions.typed("saveEdition", "SAVE_EDITION");

            actions.empty("startedSavingEdition", "STARTED_SAVING_EDITION")
                .withSample(init, reassign(init, {isSaving: true}))
                .withSample(reassign(init, {isSaving: true}), reassign(init, {isSaving: true}));

            actions.empty("finishedSavingEdition", "FINISHED_SAVING_EDITION")
                .withSample(init, init)
                .withSample(reassign(init, {isSaving: true}), init);

            actions.empty("savedWithSuccess", "SAVED_WITH_SUCCESS")
                .withSample(init, reassign(init, {saved: true}))
                .withSample(reassign(init, {saved: true}), reassign(init, {saved: true}));

            actions.typed("errorLoadingData", "ERROR_LOADING_DATA");
        }
    ));

describe("createEditStore", () => {
    const serviceEmptyMock = jest.fn(() => null);

    describe("Sanity checks", () => {
        it("should be a function", () => expect(typeof createEditStore).toBe("function"));
    });

    describe("Initial state testing", () => {
        testLastStateEffects<EditState, EditStore>(
            "Given a defaultDetailsStore", createEditStore(serviceEmptyMock))
            ("When the store receives no actions", "The state should be default", [],
            state => {
                expect(state).toEqual(defaultEditState());
                expect(state.canSave).toEqual(defaultEditState().canSave);
                expect(state.editable).toEqual(defaultEditState().editable);
                expect(state.isAvatarButtonOpen).toEqual(defaultEditState().isAvatarButtonOpen);
                expect(state.isSaving).toEqual(defaultEditState().isSaving);
                expect(state.item).toEqual(defaultEditState().item);
                expect(state.newStatus).toEqual(defaultEditState().newStatus);
                expect(state.saved).toEqual(defaultEditState().saved);
            });

        testLastStateEffects<EditState, EditStore>(
            "Given an initial state", () => createEditStore(serviceEmptyMock)({init: withData})
            )("When the store receives no actions", "The state should be the given state", [],
                state => {
                    expect(state).toEqual(withData);
                    expect(state.canSave).toEqual(withData.canSave);
                    expect(state.editable).toEqual(withData.editable);
                    expect(state.isAvatarButtonOpen).toEqual(withData.isAvatarButtonOpen);
                    expect(state.isSaving).toEqual(withData.isSaving);
                    expect(state.item).toEqual(withData.item);
                    expect(state.newStatus).toEqual(withData.newStatus);
                    expect(state.saved).toEqual(withData.saved);
                });
    });

    describe("Save Edition Effects", () => {
        const successSaveEditionMockService = (delay: number = 40) =>
            jest.fn<Observable<SaveEditionResult>>(() =>
                Observable
                    .of<SaveEditionResult>({
                        kind: "success",
                    })
                    .delay(delay, queue));

        const errorSaveEditionMockService = (delay: number = 40) =>
            jest.fn<Observable<SaveEditionResult>>(() =>
                Observable
                    .of<SaveEditionResult>({
                        kind: "error",
                        error: errorMessage,
                    })
                    .delay(delay, queue));

        const successTester = testActionEffects<EditState, EditStore>(
            "Given an Edit store with success results",
            () => createEditStore(successSaveEditionMockService(0))({init: withData}));

        const errorTester = testActionEffects<EditState, EditStore>(
            "Given an Edit store with error results",
            () => createEditStore(errorSaveEditionMockService(0))({init: withData}));

        const notAbletoSaveTester = testActionEffects<EditState, EditStore>(
            "Given an Edit store with error results",
            () => createEditStore(errorSaveEditionMockService(0))());

        successTester("When the store receives a save edition command under succesful conditions",
            "it should dispatch startedSavingEdition, savedWithSuccess and finishedSavingEdition actions",
            [EditActions.saveEdition(nonEmptyItem)],
            actions => {
                expectAction(actions, EditActions.startedSavingEdition());
                expectAction(actions, EditActions.savedWithSuccess());
                expectAction(actions, EditActions.finishedSavingEdition());
            }, {
                count: 3,
            }
        );

        errorTester("When the store receives a save edition command under failure conditions",
            "it should dispatch startedSavingEdition, errorLoadingData and finishedSavingEdition actions",
            [EditActions.saveEdition(nonEmptyItem)],
            actions => {
                expectAction(actions, EditActions.startedSavingEdition());
                expectAction(actions, EditActions.errorLoadingData(errorMessage));
                expectAction(actions, EditActions.finishedSavingEdition());
            }, {
                count: 3,
            },
        );

        notAbletoSaveTester("When the store receives a save edition command under invalid conditions",
            "it should dispatch just the same saveEdition command",
            [EditActions.saveEdition(nonEmptyItem)],
            actions => {
                expectAction(actions, EditActions.saveEdition(nonEmptyItem));
            }, {
                count: 1,
            },
        );
    });

    describe("Validation effects", () => {
        const validationStateTest = testLastStateEffects<EditState, EditStore>(
            "Given a Login store",
            createEditStore(serviceEmptyMock)
        );

        validationStateTest("When the store receives no events",
            "it should not be possible to save",
            [],
            s => expect(s.canSave).toBeFalsy
        );

        validationStateTest("When the store has a valid editable item",
            "it should be possible to save",
            [EditActions.loadEditItem(nonEmptyItem)],
            s => expect(s.canSave).toBeTruthy
        );
    });

});
