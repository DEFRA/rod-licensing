#!/bin/bash
###############################################################################
#  GitHub Actions deployment script
###############################################################################
set -e
trap 'exit 1' INT

if [[ "${COMMIT_MESSAGE}" =~ ^(SEMVER-MAJOR) ]]; then
  RELEASE_TYPE="major"
elif [[ "${COMMIT_MESSAGE}" =~ ^(SEMVER-PATCH|patch|hotfix) ]]; then
  RELEASE_TYPE="patch"
else
  RELEASE_TYPE="minor"
fi
echo "Executing deployment - BRANCH=${BRANCH}, COMMIT_MESSAGE=${COMMIT_MESSAGE}, RELEASE_TYPE=${RELEASE_TYPE}"

# Use the npm semver package to help determine release versions
echo "Installing semver"
npm i -g semver

echo "Checking out target branch"
git branch | cat
git checkout "${BRANCH}"
git branch -avl

# Ensure that git will return tags with pre-releases in the correct order (e.g. 0.1.0-rc.0 occurs before 0.1.0)
echo "Removing existing git tag versionsort configuration"
git config --global --unset-all versionsort.suffix || echo "No existing versionsort.suffix found it git configuration."
echo "Setting required git tag versionsort configuration"
git config --global --add versionsort.suffix -beta.
git config --global --add versionsort.suffix -rc.

# Calculate PREVIOUS_VERSION and NEW_VERSION based on the source and target of the merge
echo "Determining versions for release"
if [ "${BRANCH}" == "master" ]; then
    # Creating new release on the master branch, determine latest release version on master branch only
    PREVIOUS_VERSION=$(git tag --list --merged master --sort=version:refname | tail -1)
    echo "Latest build on the master branch is ${PREVIOUS_VERSION}"
    NEW_VERSION="v$(semver "${PREVIOUS_VERSION}" -i ${RELEASE_TYPE})"
elif [ "$BRANCH" == "develop" ]; then
    git tag --list --sort=version:refname
    # Creating new release on the develop branch, determine latest release version on either develop or master
    PREVIOUS_VERSION=$(git tag --list --sort=version:refname | tail -1)
    echo "Latest build in the repository is ${PREVIOUS_VERSION}"
    if [[ ${PREVIOUS_VERSION} =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        # Most recent version is a production release on master, start a new prerelease on develop
        NEW_VERSION="v$(semver "${PREVIOUS_VERSION}" -i preminor --preid rc)"
    else
        # Most recent version is already a pre-release on the develop branch, just increment the pre-release number
        NEW_VERSION="v$(semver "${PREVIOUS_VERSION}" -i prerelease --preid rc)"
    fi
else
    echo "Skipping deployment for branch ${BRANCH}"
    exit 0
fi

echo "Updating version from ${PREVIOUS_VERSION} to ${NEW_VERSION}"
