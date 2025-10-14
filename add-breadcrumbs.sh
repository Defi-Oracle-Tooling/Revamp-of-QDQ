#!/bin/bash

# Script to add breadcrumb navigation to all documentation markdown files
# Usage: ./add-breadcrumbs.sh

# Function to generate breadcrumb for a file path
generate_breadcrumb() {
    local file="$1"
    local relative_path="${file#./docs/}"
    local dir_path=$(dirname "$relative_path")
    local filename=$(basename "$relative_path" .md)
    
    # Skip root README
    if [[ "$relative_path" == "README.md" ]]; then
        return 0
    fi
    
    local breadcrumb="🏠 [Documentation Home](../README.md)"
    
    # Build breadcrumb path
    if [[ "$dir_path" != "." ]]; then
        IFS='/' read -ra DIRS <<< "$dir_path"
        local current_path=""
        for dir in "${DIRS[@]}"; do
            if [[ -n "$current_path" ]]; then
                current_path="$current_path/$dir"
            else
                current_path="$dir"
            fi
            
            # Calculate relative path back to docs root
            local depth=$(echo "$dir_path" | tr -cd '/' | wc -c)
            local back_path=""
            for ((i=0; i<depth; i++)); do
                back_path="../$back_path"
            done
            
            # Capitalize first letter of directory name
            local display_name="$(tr '[:lower:]' '[:upper:]' <<< ${dir:0:1})${dir:1}"
            breadcrumb="$breadcrumb → [$display_name](${back_path}$current_path/)"
        done
    fi
    
    breadcrumb="$breadcrumb → **$filename**"
    
    # Check if file already has breadcrumb
    if grep -q "🏠.*Documentation Home" "$file"; then
        echo "✓ Breadcrumb already exists in $file"
        return 0
    fi
    
    # Create temp file with breadcrumb at the top
    local temp_file=$(mktemp)
    
    # Add breadcrumb after the first heading
    local added_breadcrumb=false
    while IFS= read -r line; do
        echo "$line" >> "$temp_file"
        if [[ "$line" =~ ^#[[:space:]] ]] && [[ "$added_breadcrumb" == false ]]; then
            echo "" >> "$temp_file"
            echo "$breadcrumb" >> "$temp_file"
            echo "" >> "$temp_file"
            added_breadcrumb=true
        fi
    done < "$file"
    
    # Replace original file
    mv "$temp_file" "$file"
    
    echo "✓ Added breadcrumb to $file"
}

# Find all markdown files in docs directory (except root README) and add breadcrumbs
find docs/ -name "*.md" -type f ! -path "docs/README.md" | while read -r file; do
    generate_breadcrumb "$file"
done

echo "🎉 Breadcrumb navigation added to all documentation files!"