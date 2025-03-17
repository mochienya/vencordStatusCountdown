/* eslint-disable simple-header/header */
/*
 * Copyright (c) 2025 mochie and cassie
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, Toasts, UserSettingsActionCreators } from "@webpack/common";

const settings = definePluginSettings({
    date: {
        type: OptionType.STRING,
        description: "ISO date string (YYYY-MM-DD) for what day to count down to",
        default: "2036-08-12",
        onChange: updateStatus,
    },
    text: {
        type: OptionType.STRING,
        description: "What your status should be. \"%d\" is a placeholder for how many days until the set date",
        default: "%d days left",
        // timeout so it doesn't run multiple at once so API doesn't get spammed (terrible) (it still runs twice? at least it's a bit delayed)
        onChange: () => setTimeout(updateStatus, 500),
    },
    finishText: {
        type: OptionType.STRING,
        description: "What your status should be on the set date",
        default: "august 12th 2036! the heat death of the universe!",
        onChange: () => setTimeout(updateStatus, 1000),
    }
});

export default definePlugin({
    name: "StatusCountdown",
    description: "Automated days countdown in your status.",
    authors: [{ name: "mochie", id: 1043599230247374869n }, { name: "cassie", id: 280411966126948353n }],
    settings,

    start() {
        updateStatus();
        setInterval(updateStatus, 1000 * 60 * 60);
    },
});

function getStatusString(): string | undefined {
    const today = new Date().getTime();
    const goalDay = new Date(settings.store.date).getTime();
    if (isNaN(goalDay)) {
        Toasts.show({
            message: "Invalid target date",
            type: Toasts.Type.FAILURE,
            id: Toasts.genId()
        });
        return;
    }

    const unixDiff = goalDay - today;
    const dayDiff = Math.ceil(unixDiff / (1000 * 60 * 60 * 24));

    if (dayDiff <= 0) { return settings.store.finishText; }

    return settings.store.text.replace("%d", dayDiff.toString());
}

function updateStatus() {
    const newStatus = getStatusString();
    if (!newStatus) return;

    const currentStatus = UserSettingsActionCreators.PreloadedUserSettingsActionCreators.getCurrentValue()?.status?.customStatus?.text;
    if (currentStatus === newStatus) return;

    const proto = UserSettingsActionCreators.PreloadedUserSettingsActionCreators.ProtoClass.create();
    proto.status = {
        customStatus: { text: newStatus }
    };

    FluxDispatcher.dispatch({
        type: "USER_SETTINGS_PROTO_UPDATE",
        partial: true,
        settings: {
            type: 1,
            proto
        }
    });
}
