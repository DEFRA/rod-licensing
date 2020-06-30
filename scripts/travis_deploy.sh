#!/bin/bash
###############################################################################
#  Travis deployment script
###############################################################################

if [[ $(lerna changed -p) ]]; then
    # Run lerna version to re-write package metadata with appropriate versions and create new git tag (don't push to remote yet!)
    echo "Creating new version"
    lerna version prerelease --yes --preid beta --no-push

    # Determine the previous and current release tags
    PREVIOUS_RELEASE=$(git describe --match "v[0-9].[0-9].[0-9]-*" --abbrev=0 HEAD~1)
    CURRENT_RELEASE=$(git describe --match "v[0-9].[0-9].[0-9]-*" --abbrev=0 HEAD)

    # Generate changelog information for changes since the last tag
    echo "Generating changelog updates for all changes between ${PREVIOUS_RELEASE} and ${CURRENT_RELEASE}"
    lerna-changelog --from "${PREVIOUS_RELEASE}" | cat - CHANGELOG.md > CHANGELOG.new && mv CHANGELOG.new CHANGELOG.md
    git commit -a --amend --no-edit --no-verify

    # Push new tag, updated changelog and package metadata to the remote
    git push

    # Publish packages to npm
    lerna publish from-git --yes --dist-tag beta
else
    echo "No changes detected. Skipping"
fi
