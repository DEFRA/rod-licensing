#!/bin/bash
###############################################################################
#  Travis deployment script
###############################################################################

# Determine the most recent pre-release tag
LAST_PRERELEASE=$(git describe --match "v[0-9].[0-9].[0-9]-*" --abbrev=0)

# Generate changelog information for changes since the last tag
echo "Generating changelog updates for all changes since ${LAST_PRERELEASE}"
lerna-changelog --from "${LAST_PRERELEASE}" | cat - CHANGELOG.md > CHANGELOG.new && mv CHANGELOG.new CHANGELOG.md

# Commit the updated changelog to github
git add -A CHANGELOG.md
git commit -m "chore(release): Update changelog with changes since ${LAST_PRERELEASE}"
git push origin

# Now publish the new release
echo "Publishing new pre-release"
npm run lerna:prerelease && npm run lerna:publish
