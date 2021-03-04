'use strict';

const MissingPermission = require('../missing-permission');
const { ADMIN } = require('../permissions');
const { hasFeatureEnabled } = require('../util/feature-enabled');

module.exports = function(config, permission) {
    if (permission && hasFeatureEnabled(config, 'rbac')) {
        return async (req, res, next) => {
            const { hasPermission, user } = req;
            const canAccess = await hasPermission(user, permission);
            if (canAccess) {
                return next();
            }
            return res
                .status(403)
                .json(
                    new MissingPermission({
                        permission,
                        message: `You require ${permission} to perform this action`,
                    }),
                )
                .end();
        };
    }
    if (!permission || !config.extendedPermissions) {
        return (req, res, next) => next();
    }
    return (req, res, next) => {
        if (
            req.user &&
            req.user.permissions &&
            (req.user.permissions.indexOf(ADMIN) !== -1 ||
                req.user.permissions.indexOf(permission) !== -1)
        ) {
            return next();
        }
        return res
            .status(403)
            .json(
                new MissingPermission({
                    permission,
                    message: `You require ${permission} to perform this action`,
                }),
            )
            .end();
    };
};
