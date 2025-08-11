"use strict";
// Shared types for ticker data used by both frontend and backend
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSMessageType = void 0;
var WSMessageType;
(function (WSMessageType) {
    WSMessageType["CONNECTION"] = "connection";
    WSMessageType["SUBSCRIBE"] = "subscribe";
    WSMessageType["UNSUBSCRIBE"] = "unsubscribe";
    WSMessageType["PRICE_UPDATE"] = "price_update";
    WSMessageType["ERROR"] = "error";
    WSMessageType["HEARTBEAT"] = "heartbeat";
})(WSMessageType || (exports.WSMessageType = WSMessageType = {}));
//# sourceMappingURL=ticker.types.js.map