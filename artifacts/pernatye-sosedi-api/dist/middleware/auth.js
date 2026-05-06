"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
function requireAuth(req, res, next) {
    const userId = req.headers["x-user-id"];
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    req.userId = userId;
    next();
}
