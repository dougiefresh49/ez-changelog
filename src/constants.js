
module.exports = {
    GIT_TAG_CMD: 'git describe --tags --abbrev=0',
    GIT_LOG_CMD: 'git log --grep="%s" -E --date=local --format=%s %s..HEAD',
    EMPTY_COMPONENT: '$$'
};