#!/usr/bin/env node

// Simple static search index generator for documentation
// Creates a searchable index of all documentation content

const fs = require('fs');
const path = require('path');

class DocumentationIndexer {
    constructor(docsPath = './docs') {
        this.docsPath = path.resolve(docsPath);
        this.index = {
            documents: [],
            searchIndex: {},
            metadata: {
                generated: new Date().toISOString(),
                totalDocuments: 0,
                totalWords: 0
            }
        };
    }

    async generateIndex() {
        console.log('🔍 Generating documentation search index...');
        
        try {
            await this.processDirectory(this.docsPath);
            this.buildSearchIndex();
            this.saveIndex();
            this.generateStats();
        } catch (error) {
            console.error('❌ Error generating index:', error.message);
            process.exit(1);
        }
    }

    async processDirectory(dirPath, relativePath = '') {
        const entries = fs.readdirSync(dirPath);

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry);
            const relativeFilePath = path.join(relativePath, entry);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // Skip hidden directories and assets
                if (!entry.startsWith('.') && entry !== 'assets') {
                    await this.processDirectory(fullPath, relativeFilePath);
                }
            } else if (stat.isFile() && entry.endsWith('.md')) {
                await this.processFile(fullPath, relativeFilePath);
            }
        }
    }

    async processFile(filePath, relativePath) {
        console.log(`📄 Processing: ${relativePath}`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        const document = this.parseMarkdownContent(content, relativePath);
        
        if (document) {
            this.index.documents.push(document);
        }
    }

    parseMarkdownContent(content, filePath) {
        // Extract metadata from front matter if present
        const frontMatterRegex = /^---\s*\n(.*?)\n---\s*\n/s;
        const frontMatterMatch = content.match(frontMatterRegex);
        
        let metadata = {};
        let bodyContent = content;
        
        if (frontMatterMatch) {
            bodyContent = content.replace(frontMatterRegex, '');
            // Simple YAML-like parsing for basic metadata
            const frontMatter = frontMatterMatch[1];
            const lines = frontMatter.split('\n');
            lines.forEach(line => {
                const match = line.match(/^(\w+):\s*(.+)$/);
                if (match) {
                    metadata[match[1]] = match[2].replace(/['"]/g, '');
                }
            });
        }

        // Extract title (first heading)
        const titleMatch = bodyContent.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');

        // Extract headings for navigation
        const headings = [];
        const headingRegex = /^(#{2,6})\s+(.+)$/gm;
        let headingMatch;
        while ((headingMatch = headingRegex.exec(bodyContent)) !== null) {
            headings.push({
                level: headingMatch[1].length,
                text: headingMatch[2],
                id: this.generateId(headingMatch[2])
            });
        }

        // Extract plain text for searching (remove markdown syntax)
        const plainText = this.extractPlainText(bodyContent);
        
        // Extract code blocks
        const codeBlocks = [];
        const codeRegex = /```(\w+)?\n(.*?)\n```/gs;
        let codeMatch;
        while ((codeMatch = codeRegex.exec(content)) !== null) {
            codeBlocks.push({
                language: codeMatch[1] || 'text',
                content: codeMatch[2]
            });
        }

        // Calculate reading time (approximately 200 words per minute)
        const wordCount = plainText.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);

        return {
            id: this.generateId(filePath),
            filePath: filePath,
            url: filePath.replace('.md', '.html'), // Assuming HTML conversion
            title: title,
            content: plainText,
            headings: headings,
            codeBlocks: codeBlocks,
            metadata: metadata,
            stats: {
                wordCount: wordCount,
                readingTime: readingTime,
                headingCount: headings.length,
                codeBlockCount: codeBlocks.length
            },
            lastModified: fs.statSync(path.join(this.docsPath, filePath)).mtime.toISOString()
        };
    }

    extractPlainText(markdown) {
        return markdown
            // Remove code blocks
            .replace(/```[\s\S]*?```/g, '')
            // Remove inline code
            .replace(/`[^`]+`/g, '')
            // Remove links but keep text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove images
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
            // Remove headings markdown
            .replace(/^#{1,6}\s+/gm, '')
            // Remove emphasis
            .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
            // Remove horizontal rules
            .replace(/^---+$/gm, '')
            // Remove HTML tags
            .replace(/<[^>]+>/g, '')
            // Clean up whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }

    generateId(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    buildSearchIndex() {
        console.log('🔍 Building search index...');
        
        const stopWords = new Set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'you', 'your', 'this', 'they', 'we'
        ]);

        this.index.documents.forEach((doc, docIndex) => {
            // Index title with higher weight
            this.indexWords(doc.title, docIndex, 3);
            
            // Index headings with medium weight
            doc.headings.forEach(heading => {
                this.indexWords(heading.text, docIndex, 2);
            });
            
            // Index content with normal weight
            this.indexWords(doc.content, docIndex, 1);
            
            // Index code blocks with lower weight but specific language tags
            doc.codeBlocks.forEach(block => {
                if (block.language && block.language !== 'text') {
                    this.addToIndex(block.language, docIndex, 1);
                }
                this.indexWords(block.content, docIndex, 0.5);
            });
        });

        // Remove stop words from index
        stopWords.forEach(word => {
            delete this.index.searchIndex[word];
        });
    }

    indexWords(text, docIndex, weight) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        words.forEach(word => {
            if (word.length > 2) {
                this.addToIndex(word, docIndex, weight);
            }
        });
    }

    addToIndex(word, docIndex, weight) {
        if (!this.index.searchIndex[word]) {
            this.index.searchIndex[word] = {};
        }
        
        if (!this.index.searchIndex[word][docIndex]) {
            this.index.searchIndex[word][docIndex] = 0;
        }
        
        this.index.searchIndex[word][docIndex] += weight;
    }

    saveIndex() {
        const outputPath = path.join(this.docsPath, 'assets', 'search-index.json');
        
        // Ensure assets directory exists
        const assetsDir = path.dirname(outputPath);
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        // Update metadata
        this.index.metadata.totalDocuments = this.index.documents.length;
        this.index.metadata.totalWords = Object.keys(this.index.searchIndex).length;

        // Write the full index
        fs.writeFileSync(outputPath, JSON.stringify(this.index, null, 2));
        
        // Create a minified version for production
        const minOutputPath = path.join(this.docsPath, 'assets', 'search-index.min.json');
        fs.writeFileSync(minOutputPath, JSON.stringify(this.index));
        
        console.log(`💾 Search index saved to: ${outputPath}`);
        console.log(`💾 Minified index saved to: ${minOutputPath}`);
    }

    generateStats() {
        const stats = {
            totalDocuments: this.index.documents.length,
            totalWords: Object.keys(this.index.searchIndex).length,
            averageWordsPerDocument: Math.round(
                this.index.documents.reduce((sum, doc) => sum + doc.stats.wordCount, 0) / 
                this.index.documents.length
            ),
            totalReadingTime: this.index.documents.reduce((sum, doc) => sum + doc.stats.readingTime, 0),
            documentsWithCode: this.index.documents.filter(doc => doc.codeBlocks.length > 0).length,
            mostCommonWords: this.getMostCommonWords(10),
            documentsBySection: this.getDocumentsBySection()
        };

        console.log('\n📊 Documentation Statistics:');
        console.log(`   📄 Total Documents: ${stats.totalDocuments}`);
        console.log(`   📝 Total Words in Index: ${stats.totalWords}`);
        console.log(`   📖 Average Words per Document: ${stats.averageWordsPerDocument}`);
        console.log(`   ⏱️  Total Reading Time: ${stats.totalReadingTime} minutes`);
        console.log(`   💻 Documents with Code: ${stats.documentsWithCode}`);
        console.log(`   📁 Sections: ${Object.keys(stats.documentsBySection).length}`);

        // Save stats
        const statsPath = path.join(this.docsPath, 'assets', 'documentation-stats.json');
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
        console.log(`📈 Statistics saved to: ${statsPath}`);
    }

    getMostCommonWords(limit = 10) {
        const wordFreq = {};
        
        Object.keys(this.index.searchIndex).forEach(word => {
            const totalScore = Object.values(this.index.searchIndex[word])
                .reduce((sum, score) => sum + score, 0);
            wordFreq[word] = totalScore;
        });

        return Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([word, score]) => ({ word, score }));
    }

    getDocumentsBySection() {
        const sections = {};
        
        this.index.documents.forEach(doc => {
            const section = doc.filePath.split('/')[0] || 'root';
            if (!sections[section]) {
                sections[section] = 0;
            }
            sections[section]++;
        });

        return sections;
    }
}

// CLI usage
if (require.main === module) {
    const docsPath = process.argv[2] || './docs';
    const indexer = new DocumentationIndexer(docsPath);
    
    indexer.generateIndex()
        .then(() => {
            console.log('\n✅ Documentation indexing complete!');
        })
        .catch(error => {
            console.error('❌ Indexing failed:', error);
            process.exit(1);
        });
}

module.exports = DocumentationIndexer;