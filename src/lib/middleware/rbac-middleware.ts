import { hasFeatureEnabled } from '../util/feature-enabled';
import User from '../user';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const rbacMiddleware = (config: any, { accessService }: any): any => {
    const logger = config.getLogger('/middleware/rbac-middleware.js');
    if (!hasFeatureEnabled(config, 'rbac')) {
        // disable it
        return (req, res, next) => next();
    }
    return (req, res, next) => {
        req.hasPermission = async (user: User, permission: string) => {
            if (!user || !user.id) {
                logger.error(
                    'RBAC requires a user with a userId on the request.',
                );
                return false;
            }
            return accessService.hasRootPermission(user, permission);
        };
        return next();
    };
};

module.exports = rbacMiddleware;
export default rbacMiddleware;
