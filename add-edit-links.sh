#!/bin/bash

# Script to add GitHub edit links to all documentation markdown files
# Usage: ./add-edit-links.sh

REPO_URL="https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ"
BRANCH="feat/regional-topology-config"
BASE_PATH="docs"

# Function to add edit link to a markdown file
add_edit_link() {
    local file="$1"
    local relative_path="${file#./}"
    local edit_url="${REPO_URL}/edit/${BRANCH}/${relative_path}"
    
    # Check if file already has edit link
    if grep -q "Edit this page" "$file"; then
        echo "✓ Edit link already exists in $file"
        return 0
    fi
    
    # Add edit link at the end of the file
    echo "" >> "$file"
    echo "---" >> "$file"
    echo "" >> "$file"
    echo "**📝 Edit this page**: [Edit on GitHub]($edit_url)" >> "$file"
    
    echo "✓ Added edit link to $file"
}

# Find all markdown files in docs directory and add edit links
find docs/ -name "*.md" -type f | while read -r file; do
    add_edit_link "$file"
done

echo "🎉 GitHub edit links added to all documentation files!"