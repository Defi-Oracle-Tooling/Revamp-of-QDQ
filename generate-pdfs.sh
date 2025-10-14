#!/bin/bash

# PDF Generation Script for Documentation
# Converts markdown documentation to PDF using pandoc

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_DIR="$PROJECT_ROOT/docs"
OUTPUT_DIR="$PROJECT_ROOT/pdf-exports"
TEMP_DIR="$(mktemp -d)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📄 Documentation PDF Generator${NC}"
echo "==============================="
echo -e "📂 Docs Directory: $DOCS_DIR"
echo -e "📁 Output Directory: $OUTPUT_DIR"
echo ""

# Check dependencies
check_dependencies() {
    echo -e "${YELLOW}🔍 Checking dependencies...${NC}"
    
    if ! command -v pandoc >/dev/null 2>&1; then
        echo "❌ pandoc is required but not installed."
        echo "Install with: sudo apt-get install pandoc (Ubuntu/Debian)"
        echo "            or brew install pandoc (macOS)"
        exit 1
    fi
    
    if ! command -v wkhtmltopdf >/dev/null 2>&1; then
        echo "⚠️  wkhtmltopdf not found. Installing for better PDF rendering..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get install -y wkhtmltopdf || echo "Could not install wkhtmltopdf"
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install wkhtmltopdf || echo "Could not install wkhtmltopdf"
        fi
    fi
    
    echo -e "${GREEN}✅ Dependencies checked${NC}"
}

# Create output directory
setup_output() {
    mkdir -p "$OUTPUT_DIR"
    echo -e "${GREEN}📁 Created output directory: $OUTPUT_DIR${NC}"
}

# Generate PDF metadata
generate_metadata() {
    cat > "$TEMP_DIR/metadata.yaml" << EOF
---
title: "Quorum Dev Quickstart Documentation"
author: "Defi Oracle Tooling"
date: "$(date '+%B %d, %Y')"
subtitle: "Complete Documentation Export"
keywords: [Quorum, Blockchain, Hyperledger, Besu, GoQuorum, Documentation]
subject: "Blockchain Development"
lang: "en"
toc: true
toc-depth: 3
numbersections: true
geometry: margin=1in
fontsize: 11pt
linestretch: 1.2
documentclass: article
papersize: letter
header-includes: |
  \usepackage{fancyhdr}
  \pagestyle{fancy}
  \fancyhead[LE,RO]{Quorum Dev Quickstart}
  \fancyhead[RE,LO]{Documentation}
  \fancyfoot[CE,CO]{\thepage}
  \usepackage{listings}
  \usepackage{xcolor}
  \lstset{
    basicstyle=\ttfamily\footnotesize,
    backgroundcolor=\color{gray!10},
    frame=single,
    breaklines=true,
    showstringspaces=false
  }
---
EOF
}

# Process individual markdown file
process_markdown_file() {
    local file="$1"
    local output_name="$2"
    
    echo -e "${BLUE}📄 Processing: $file${NC}"
    
    # Create temporary processed file
    local temp_file="$TEMP_DIR/$(basename "$file")"
    
    # Process the markdown to fix relative links and images
    sed 's|(\.\./|('$PROJECT_ROOT'/|g' "$file" > "$temp_file"
    
    # Generate PDF
    pandoc "$TEMP_DIR/metadata.yaml" "$temp_file" \
        --from markdown \
        --to pdf \
        --output "$OUTPUT_DIR/$output_name.pdf" \
        --pdf-engine=xelatex \
        --highlight-style=github \
        --variable colorlinks=true \
        --variable linkcolor=blue \
        --variable urlcolor=blue \
        --variable toccolor=gray \
        --template=eisvogel 2>/dev/null || \
    pandoc "$TEMP_DIR/metadata.yaml" "$temp_file" \
        --from markdown \
        --to pdf \
        --output "$OUTPUT_DIR/$output_name.pdf" \
        --highlight-style=github \
        --variable colorlinks=true \
        --variable linkcolor=blue \
        --variable urlcolor=blue
    
    echo -e "${GREEN}✅ Generated: $OUTPUT_DIR/$output_name.pdf${NC}"
}

# Generate complete documentation PDF
generate_complete_pdf() {
    echo -e "${BLUE}📚 Generating complete documentation PDF...${NC}"
    
    # Create master file with all documentation
    local master_file="$TEMP_DIR/complete-documentation.md"
    
    # Start with main README
    if [[ -f "$DOCS_DIR/README.md" ]]; then
        echo "# Quorum Dev Quickstart Documentation" > "$master_file"
        echo "" >> "$master_file"
        tail -n +2 "$DOCS_DIR/README.md" >> "$master_file"
        echo -e "\n\\pagebreak\n" >> "$master_file"
    fi
    
    # Add sections in order
    local sections=(
        "getting-started"
        "configuration" 
        "architecture"
        "integrations"
        "security"
        "operations"
        "development"
        "reference"
    )
    
    for section in "${sections[@]}"; do
        if [[ -d "$DOCS_DIR/$section" ]]; then
            echo -e "\n# $(echo "$section" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')\n" >> "$master_file"
            
            find "$DOCS_DIR/$section" -name "*.md" -type f | sort | while read -r file; do
                echo -e "\n## $(basename "$file" .md | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')\n" >> "$master_file"
                tail -n +2 "$file" >> "$master_file"
                echo -e "\n\\pagebreak\n" >> "$master_file"
            done
        fi
    done
    
    # Generate the complete PDF
    process_markdown_file "$master_file" "complete-documentation"
}

# Generate individual section PDFs
generate_section_pdfs() {
    echo -e "${BLUE}📑 Generating individual section PDFs...${NC}"
    
    # Main README
    if [[ -f "$DOCS_DIR/README.md" ]]; then
        process_markdown_file "$DOCS_DIR/README.md" "00-overview"
    fi
    
    # Individual sections
    find "$DOCS_DIR" -mindepth 1 -maxdepth 1 -type d | sort | while read -r section_dir; do
        local section_name=$(basename "$section_dir")
        echo -e "${BLUE}📂 Processing section: $section_name${NC}"
        
        # Create combined section file
        local section_file="$TEMP_DIR/$section_name.md"
        echo "# $(echo "$section_name" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')" > "$section_file"
        echo "" >> "$section_file"
        
        find "$section_dir" -name "*.md" -type f | sort | while read -r file; do
            echo -e "\n## $(basename "$file" .md | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')\n" >> "$section_file"
            tail -n +2 "$file" >> "$section_file"
            echo -e "\n---\n" >> "$section_file"
        done
        
        process_markdown_file "$section_file" "$section_name"
    done
}

# Create index file
create_index() {
    local index_file="$OUTPUT_DIR/README.md"
    
    cat > "$index_file" << 'EOF'
# 📄 Documentation PDF Exports

This directory contains PDF exports of the Quorum Dev Quickstart documentation.

## 📚 Available Documents

### Complete Documentation
- **`complete-documentation.pdf`** - All documentation in a single PDF

### Section-by-Section PDFs
- **`00-overview.pdf`** - Main documentation overview
- **`getting-started.pdf`** - Installation and quick start guides
- **`configuration.pdf`** - Configuration options and settings
- **`architecture.pdf`** - System architecture and diagrams
- **`integrations.pdf`** - Integration guides and analysis
- **`security.pdf`** - Security guidelines and audit information
- **`operations.pdf`** - Operational procedures and troubleshooting
- **`development.pdf`** - Development guides and contribution info
- **`reference.pdf`** - Reference materials and contracts

## 📅 Generation Info

EOF
    
    echo "- **Generated:** $(date)" >> "$index_file"
    echo "- **Source:** Documentation from $(basename "$PROJECT_ROOT")" >> "$index_file"
    echo "- **Total Files:** $(find "$OUTPUT_DIR" -name "*.pdf" | wc -l)" >> "$index_file"
    
    cat >> "$index_file" << 'EOF'

## 🔄 Regeneration

To regenerate these PDFs, run:

```bash
./generate-pdfs.sh
```

## 📋 Requirements

- pandoc
- xelatex (recommended) or pdflatex
- wkhtmltopdf (optional, for enhanced rendering)

---

*Generated automatically from markdown documentation*
EOF

    echo -e "${GREEN}📋 Created index file: $index_file${NC}"
}

# Cleanup function
cleanup() {
    rm -rf "$TEMP_DIR"
}

# Main execution
main() {
    echo -e "${YELLOW}🚀 Starting PDF generation...${NC}"
    
    check_dependencies
    setup_output
    generate_metadata
    
    # Generate PDFs
    generate_complete_pdf
    generate_section_pdfs
    
    # Create index
    create_index
    
    # Summary
    echo ""
    echo -e "${GREEN}🎉 PDF generation complete!${NC}"
    echo -e "${BLUE}📊 Summary:${NC}"
    echo -e "   📁 Output directory: $OUTPUT_DIR"
    echo -e "   📄 Total PDFs generated: $(find "$OUTPUT_DIR" -name "*.pdf" 2>/dev/null | wc -l)"
    echo -e "   💾 Total size: $(du -sh "$OUTPUT_DIR" 2>/dev/null | cut -f1)"
    echo ""
    echo -e "${YELLOW}💡 Tip: Open $OUTPUT_DIR to view all generated PDFs${NC}"
}

# Trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"