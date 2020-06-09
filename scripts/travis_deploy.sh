#!/bin/bash
###############################################################################
#  Travis deployment script
###############################################################################

# Determine the most recent release tag
LAST_TAG=$(git describe --abbrev=0)

# Generate changelog information for changes since the last tag
echo "Generating changelog updates for all changes since ${LAST_TAG}"
lerna-changelog --from "${LAST_TAG}" | cat - CHANGELOG.md > CHANGELOG.new && mv CHANGELOG.new CHANGELOG.md

# Commit the updated changelog to github
git add -A CHANGELOG.md
git commit -m "chore(release): Update changelog with changes since ${LAST_TAG}"
git push origin

# Now publish the new release
echo "Publishing new pre-release"
npm run lerna:prerelease && npm run lerna:publish

echo "Finished publishing $(git describe --abbrev=0)"
