"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.window.__pan = exports.window.__pan || {
    csrfToken: "%_PAN_CSRF_TOKEN_%",
    routePrefix: "%_PAN_ROUTE_PREFIX_%",
    observer: null,
    clickListener: null,
    mouseoverListener: null,
    inertiaStartListener: null,
};
if (exports.window.__pan.observer) {
    exports.window.__pan.observer.disconnect();
    exports.window.__pan.observer = null;
}
if (exports.window.__pan.clickListener) {
    document.removeEventListener("click", exports.window.__pan.clickListener);
    exports.window.__pan.clickListener = null;
}
if (exports.window.__pan.mouseoverListener) {
    document.removeEventListener(
        "mouseover",
        exports.window.__pan.mouseoverListener,
    );
    exports.window.__pan.mouseoverListener = null;
}
if (exports.window.__pan.inertiaStartListener) {
    document.removeEventListener(
        "inertia:start",
        exports.window.__pan.inertiaStartListener,
    );
    exports.window.__pan.inertiaStartListener = null;
}
(function () {
    var domObserver = function (callback) {
        var observer = new MutationObserver(callback);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
        });
        exports.window.__pan.observer = observer;
    };
    var queue = [];
    var queueTimeout = null;
    var impressed = [];
    var hovered = [];
    var clicked = [];
    var commit = function () {
        if (queue.length === 0) {
            return;
        }
        var onGoingQueue = queue.slice();
        queue = [];
        navigator.sendBeacon(
            "/".concat(exports.window.__pan.routePrefix, "/events"),
            new Blob(
                [
                    JSON.stringify({
                        events: onGoingQueue,
                        _token: exports.window.__pan.csrfToken,
                    }),
                ],
                {
                    type: "application/json",
                },
            ),
        );
    };
    var queueCommit = function () {
        queueTimeout && clearTimeout(queueTimeout);
        // @ts-ignore
        queueTimeout = setTimeout(commit, 1000);
    };
    var send = function (el, event) {
        var target = el.target;
        var element = target.closest("[data-pan]");
        if (element === null) {
            return;
        }
        var name = element.getAttribute("data-pan");
        var description = element.getAttribute("data-pan-description");
        if (name === null) {
            return;
        }
        if (event === "hover") {
            if (
                hovered.some(function (analytic) {
                    return analytic.name === name;
                })
            ) {
                return;
            }
            hovered.push({
                name: name,
                description: description,
            });
        }
        if (event === "click") {
            if (
                clicked.some(function (analytic) {
                    return analytic.name === name;
                })
            ) {
                return;
            }
            clicked.push({
                name: name,
                description: description,
            });
        }
        queue.push({
            type: event,
            name: name,
            description: description,
        });
        queueCommit();
    };
    var detectImpressions = function () {
        var elementsBeingImpressed = document.querySelectorAll("[data-pan]");
        elementsBeingImpressed.forEach(function (element) {
            if (
                element.checkVisibility !== undefined &&
                !element.checkVisibility()
            ) {
                return;
            }
            var name = element.getAttribute("data-pan");
            var description = element.getAttribute("data-pan-description");
            if (name === null) {
                return;
            }
            if (
                impressed.some(function (analytic) {
                    return analytic.name === name;
                })
            ) {
                return;
            }
            impressed.push({
                name: name,
                description: description,
            });
            queue.push({
                type: "impression",
                name: name,
                description: description,
            });
        });
        queueCommit();
    };
    domObserver(function () {
        impressed.forEach(function (_a) {
            var name = _a.name;
            var element = document.querySelector(
                "[data-pan='".concat(name, "']"),
            );
            if (element === null) {
                impressed = impressed.filter(function (_a) {
                    var n = _a.name;
                    return n !== name;
                });
                hovered = hovered.filter(function (_a) {
                    var n = _a.name;
                    return n !== name;
                });
                clicked = clicked.filter(function (_a) {
                    var n = _a.name;
                    return n !== name;
                });
            }
        });
        detectImpressions();
    });
    exports.window.__pan.clickListener = function (event) {
        return send(event, "click");
    };
    document.addEventListener("click", exports.window.__pan.clickListener);
    exports.window.__pan.mouseoverListener = function (event) {
        return send(event, "hover");
    };
    document.addEventListener(
        "mouseover",
        exports.window.__pan.mouseoverListener,
    );
    exports.window.__pan.inertiaStartListener = function (event) {
        impressed = [];
        hovered = [];
        clicked = [];
        detectImpressions();
    };
    document.addEventListener(
        "inertia:start",
        exports.window.__pan.inertiaStartListener,
    );
    exports.window.__pan.beforeUnloadListener = function (event) {
        if (queue.length === 0) {
            return;
        }
        commit();
    };
    exports.window.addEventListener(
        "beforeunload",
        exports.window.__pan.beforeUnloadListener,
    );
})();
