interface ExperimentalFlags {
    [key: string]: boolean;
}

interface Config {
    experimental: ExperimentalFlags;
}

export enum FEATURES {
    RBAC = 'rbac',
}

export const isFeatureEnabled = (
    config: Config,
    experimentalFeature: string,
): boolean => {
    return (
        config &&
        config.experimental &&
        config.experimental[experimentalFeature]
    );
};

module.exports = { isFeatureEnabled, FEATURES };
