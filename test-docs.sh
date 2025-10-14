#!/bin/bash

# Documentation Testing Framework
# Tests all code examples, links, and ensures documentation examples work

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMP_DIR="$(mktemp -d)"
LOG_FILE="$TEMP_DIR/doc-test.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🧪 Documentation Testing Framework"
echo "=================================="
echo "📂 Project Root: $PROJECT_ROOT"
echo "📝 Log File: $LOG_FILE"
echo ""

# Test Results
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Function to log and display
log_and_echo() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    log_and_echo "${BLUE}🧪 Running: $test_name${NC}"
    
    if $test_function >> "$LOG_FILE" 2>&1; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_and_echo "${GREEN}✅ PASSED: $test_name${NC}"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS+=("$test_name")
        log_and_echo "${RED}❌ FAILED: $test_name${NC}"
        return 1
    fi
}

# Test 1: Validate Markdown Files
test_markdown_syntax() {
    if ! command -v markdownlint >/dev/null 2>&1; then
        echo "Installing markdownlint..."
        npm install -g markdownlint-cli
    fi
    
    echo "Checking markdown syntax in docs/"
    markdownlint docs/ --config .markdownlint.json
}

# Test 2: Check Internal Links
test_internal_links() {
    echo "Checking internal links..."
    
    find docs/ -name "*.md" -type f | while read -r file; do
        echo "Checking links in: $file"
        
        # Extract markdown links [text](link)
        grep -oE '\[([^\]]*)\]\(([^)]*)\)' "$file" | while IFS= read -r link; do
            # Extract the URL part
            url=$(echo "$link" | sed -E 's/.*\]\(([^)]*)\).*/\1/')
            
            # Skip external URLs and anchors
            if [[ "$url" =~ ^https?:// ]] || [[ "$url" =~ ^# ]] || [[ "$url" =~ ^mailto: ]]; then
                continue
            fi
            
            # Resolve relative path
            if [[ "$url" =~ ^\.\. ]]; then
                # Relative to parent directory
                target_dir=$(dirname "$file")
                target_file="$target_dir/$url"
            else
                # Relative to current directory
                target_file="$(dirname "$file")/$url"
            fi
            
            # Check if target exists
            if [[ ! -f "$target_file" ]] && [[ ! -d "$target_file" ]]; then
                echo "❌ Broken link in $file: $url -> $target_file"
                return 1
            fi
        done
    done
}

# Test 3: Validate JSON/YAML Examples
test_config_examples() {
    echo "Testing configuration examples..."
    
    # Test JSON examples
    find docs/ -name "*.md" -type f -exec grep -l '```json' {} \; | while read -r file; do
        echo "Checking JSON in: $file"
        
        # Extract JSON blocks and validate
        sed -n '/```json/,/```/p' "$file" | sed '1d;$d' > "$TEMP_DIR/test.json"
        
        if [[ -s "$TEMP_DIR/test.json" ]]; then
            if ! jq empty < "$TEMP_DIR/test.json" 2>/dev/null; then
                echo "❌ Invalid JSON in $file"
                return 1
            fi
        fi
    done
    
    # Test YAML examples
    if command -v yq >/dev/null 2>&1; then
        find docs/ -name "*.md" -type f -exec grep -l '```yaml' {} \; | while read -r file; do
            echo "Checking YAML in: $file"
            
            sed -n '/```yaml/,/```/p' "$file" | sed '1d;$d' > "$TEMP_DIR/test.yaml"
            
            if [[ -s "$TEMP_DIR/test.yaml" ]]; then
                if ! yq empty < "$TEMP_DIR/test.yaml" >/dev/null 2>&1; then
                    echo "❌ Invalid YAML in $file"
                    return 1
                fi
            fi
        done
    fi
}

# Test 4: Check CLI Command Examples
test_cli_examples() {
    echo "Testing CLI command examples..."
    
    # Create a temporary test environment
    cd "$TEMP_DIR"
    npm init -y >/dev/null 2>&1
    
    # Test basic CLI commands that don't require full setup
    echo "Testing basic npx command syntax..."
    
    # Extract CLI commands from documentation
    grep -r "npx quorum-dev-quickstart" docs/ | while IFS= read -r line; do
        # Extract the command
        command=$(echo "$line" | sed -E 's/.*npx quorum-dev-quickstart(.*)$/npx quorum-dev-quickstart\1/' | head -1)
        
        # Validate command syntax (dry run)
        echo "Validating: $command"
        
        # Check for common syntax errors
        if [[ ! "$command" =~ --outputPath ]]; then
            echo "⚠️  Warning: Command missing --outputPath: $command"
        fi
        
        if [[ "$command" =~ --clientType[[:space:]]+([^[:space:]]+) ]]; then
            client_type="${BASH_REMATCH[1]}"
            if [[ "$client_type" != "besu" ]] && [[ "$client_type" != "goquorum" ]]; then
                echo "❌ Invalid client type: $client_type"
                return 1
            fi
        fi
    done
}

# Test 5: Validate Code Block Syntax
test_code_blocks() {
    echo "Testing code block syntax..."
    
    find docs/ -name "*.md" -type f | while read -r file; do
        echo "Checking code blocks in: $file"
        
        # Check for unclosed code blocks
        if ! awk '
            BEGIN { in_block = 0 }
            /^```/ { 
                if (in_block) in_block = 0; 
                else in_block = 1 
            }
            END { 
                if (in_block) {
                    print "❌ Unclosed code block in " FILENAME; 
                    exit 1 
                } 
            }
        ' "$file"; then
            return 1
        fi
        
        # Validate JavaScript/TypeScript code blocks
        sed -n '/```javascript/,/```/p; /```typescript/,/```/p; /```js/,/```/p; /```ts/,/```/p' "$file" | \
        sed '1~2d' | sed '$d' > "$TEMP_DIR/test.js"
        
        if [[ -s "$TEMP_DIR/test.js" ]] && command -v node >/dev/null 2>&1; then
            # Basic syntax check
            if ! node -c "$TEMP_DIR/test.js" 2>/dev/null; then
                echo "⚠️  JavaScript syntax warning in $file"
            fi
        fi
    done
}

# Test 6: Check Docker Examples
test_docker_examples() {
    echo "Testing Docker configuration examples..."
    
    find docs/ -name "*.md" -type f -exec grep -l 'docker-compose' {} \; | while read -r file; do
        echo "Checking Docker configs in: $file"
        
        # Extract docker-compose.yml content
        sed -n '/```yaml/,/```/p' "$file" | grep -A 1000 'version:' | sed '/```/q' | sed '$d' > "$TEMP_DIR/docker-compose.yml"
        
        if [[ -s "$TEMP_DIR/docker-compose.yml" ]] && command -v docker-compose >/dev/null 2>&1; then
            # Validate docker-compose syntax
            if ! docker-compose -f "$TEMP_DIR/docker-compose.yml" config >/dev/null 2>&1; then
                echo "❌ Invalid docker-compose.yml in $file"
                return 1
            fi
        fi
    done
}

# Test 7: Check Image References
test_image_references() {
    echo "Testing image references..."
    
    find docs/ -name "*.md" -type f | while read -r file; do
        # Check for markdown images
        grep -oE '!\[([^\]]*)\]\(([^)]*)\)' "$file" | while IFS= read -r img; do
            img_path=$(echo "$img" | sed -E 's/.*\]\(([^)]*)\).*/\1/')
            
            # Skip external images
            if [[ "$img_path" =~ ^https?:// ]]; then
                continue
            fi
            
            # Check if local image exists
            if [[ ! -f "$(dirname "$file")/$img_path" ]] && [[ ! -f "$PROJECT_ROOT/$img_path" ]]; then
                echo "❌ Missing image in $file: $img_path"
                return 1
            fi
        done
    done
}

# Test 8: Validate Table Formatting
test_table_formatting() {
    echo "Testing table formatting..."
    
    find docs/ -name "*.md" -type f | while read -r file; do
        # Check for malformed tables
        if grep -q '|' "$file"; then
            echo "Checking tables in: $file"
            
            # Basic table validation (pipe-separated)
            awk '
                /\|.*\|/ { 
                    pipes = gsub(/\|/, "|"); 
                    if (prev_pipes && prev_pipes != pipes) {
                        print "❌ Inconsistent table columns in " FILENAME " at line " NR;
                        exit 1;
                    }
                    prev_pipes = pipes;
                }
            ' "$file" || return 1
        fi
    done
}

# Test 9: Check Mermaid Diagrams
test_mermaid_diagrams() {
    echo "Testing Mermaid diagrams..."
    
    find docs/ -name "*.md" -type f -exec grep -l '```mermaid' {} \; | while read -r file; do
        echo "Checking Mermaid diagrams in: $file"
        
        # Extract mermaid diagrams
        sed -n '/```mermaid/,/```/p' "$file" | sed '1d;$d' > "$TEMP_DIR/test.mmd"
        
        if [[ -s "$TEMP_DIR/test.mmd" ]]; then
            # Basic syntax validation
            if ! grep -qE '^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|architecture-beta)' "$TEMP_DIR/test.mmd"; then
                echo "⚠️  Mermaid diagram missing type declaration in $file"
            fi
        fi
    done
}

# Main test execution
main() {
    cd "$PROJECT_ROOT"
    
    log_and_echo "${YELLOW}Starting documentation tests...${NC}\n"
    
    # Run all tests
    run_test "Markdown Syntax Validation" test_markdown_syntax
    run_test "Internal Links Check" test_internal_links  
    run_test "Configuration Examples" test_config_examples
    run_test "CLI Command Examples" test_cli_examples
    run_test "Code Block Syntax" test_code_blocks
    run_test "Docker Examples" test_docker_examples
    run_test "Image References" test_image_references
    run_test "Table Formatting" test_table_formatting
    run_test "Mermaid Diagrams" test_mermaid_diagrams
    
    # Print summary
    echo ""
    log_and_echo "${BLUE}📊 TEST SUMMARY${NC}"
    log_and_echo "=============="
    log_and_echo "Tests Run:    $TESTS_RUN"
    log_and_echo "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
    log_and_echo "${RED}Tests Failed: $TESTS_FAILED${NC}"
    
    if [[ $TESTS_FAILED -gt 0 ]]; then
        log_and_echo "\n${RED}❌ Failed Tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            log_and_echo "  - $test"
        done
        
        log_and_echo "\n${YELLOW}📝 Full log available at: $LOG_FILE${NC}"
        exit 1
    else
        log_and_echo "\n${GREEN}🎉 All documentation tests passed!${NC}"
        exit 0
    fi
}

# Cleanup trap
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Run main function
main "$@"