interface ExperimentalFlags {
    [key: string]: boolean;
}

interface Config {
    experimental: ExperimentalFlags;
}

export const hasFeatureEnabled = (
    config: Config,
    experimentalFeature: string,
): boolean => {
    return (
        config &&
        config.experimental &&
        config.experimental[experimentalFeature]
    );
};

module.exports = { hasFeatureEnabled };
