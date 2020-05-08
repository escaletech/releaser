#! /bin/bash
(test -f $(npm bin -g)/conventional-recommended-bump && test -f $(npm bin -g)/semver) \
    || npm i -g conventional-recommended-bump semver conventional-changelog-angular

last_tag=$(git describe --abbrev=0 --tags)
increment=$(conventional-recommended-bump --preset angular)
new_ver=$(semver -i $increment $last_tag)
tag="v$new_ver"
repo_url=$(git remote get-url origin | perl -pe "s/git\@github\.com:([\w._-]+)\/([\w._-]+)\.git/https:\/\/github.com\/\1\/\2/")

echo "☁️  Fetching repo..."
git fetch origin --quiet
echo ""

echo "👇  Considering these changes:"
git log --graph --oneline --decorate --abbrev-commit $last_tag..HEAD
echo ""

while true; do
    read -p "❓  Bump from $last_tag to $tag? [y/N] " yn
    case $yn in
        [Yy]* ) break;;
        * ) echo "🚨  Release process aborted"; exit;;
    esac
done

echo "🏷  Tagging $tag"
git tag $tag -a -m "Release $tag"

echo "🛫  Pushing changes to remote"
git push origin master $tag --quiet

echo "🎉  Release created: $repo_url/releases/tag/$tag"
