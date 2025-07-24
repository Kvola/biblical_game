/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import { markup } from "@odoo/owl";
import { escape } from "@web/core/utils/strings";
import { registry } from "@web/core/registry";

function userGuideItem(env) {
    return {
        type: "item",
        id: "b_user_guide",
        description: markup(
            `<div class="d-flex align-items-center">
                <i class="fa fa-book me-2"></i>
                <span>${escape(_t("Guide utilisateur"))}</span>
            </div>`
        ),
        href: "/web/user-guide",
        callback: () => {
            env.services.action.doAction({
                type: 'ir.actions.act_url',
                url: '/web/user-guide',
                target: 'new'
            });
        },
        sequence: 65,
    };
}

registry
    .category("user_menuitems")
    .add("b_user_guide", userGuideItem);