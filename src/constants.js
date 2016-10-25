
module.exports = {
    GIT_TAG_CMD: 'git describe --tags --abbrev=0',
    GIT_LOG_CMD: 'git log --grep="%s" -E --date=local --format=%s %s..HEAD',
    GIT_LOG_NO_TAG_CMD: 'git log --grep="%s" -E --date=local --format=%s',
    EMPTY_COMPONENT: '$$'
};