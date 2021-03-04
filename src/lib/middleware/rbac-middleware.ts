import { isFeatureEnabled, FEATURES } from '../util/feature-enabled';

import { CREATE_FEATURE, UPDATE_FEATURE, DELETE_FEATURE } from '../permissions';

const featurePermissions = [CREATE_FEATURE, UPDATE_FEATURE, DELETE_FEATURE];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const rbacMiddleware = (config: any, { accessService }: any): any => {
    if (!isFeatureEnabled(config, FEATURES.RBAC)) {
        return (req, res, next) => next();
    }

    const logger = config.getLogger('/middleware/rbac-middleware.js');
    logger.info('Enabling RBAC');

    const { featureToggleStore } = config.stores;

    return (req, res, next) => {
        req.checkRbac = async (permission: string) => {
            const { user, params } = req;
            if (!user || !user.id) {
                logger.error(
                    'RBAC requires a user with a userId on the request.',
                );
                return false;
            }

            let { projectId } = params;

            if (featurePermissions.includes(permission)) {
                const { featureName } = params;
                projectId = await featureToggleStore.getProjectId(featureName);
            }

            return accessService.hasPermission(user, permission, projectId);
        };
        return next();
    };
};

module.exports = rbacMiddleware;
export default rbacMiddleware;
