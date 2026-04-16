// Load firesides from JSON file
const FIRESIDES_JSON_URL = 'https://raw.githubusercontent.com/homebrew-ec-foss/firesides/refs/heads/main/firesides.json';
// Format date to a readable format
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Extract YouTube video ID from URL
function getYouTubeId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// Parse markdown-like content to HTML
function parseMarkdown(text) {
    if (!text) return '';

    // Basic markdown parsing
    let html = text;

    // Convert YouTube embeds FIRST: ![any text](YouTube URL) - must be before paragraph conversion
    html = html.replace(/!\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\)]+))\)/g, (match, altText, url) => {
        const cleanVideoId = getYouTubeId(url);
        if (cleanVideoId) {
            return `\n<div class="youtube-embed"><iframe src="https://www.youtube.com/embed/${cleanVideoId}" title="${altText}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>\n`;
        }
        return match;
    });

    // Convert blockquotes: > text
    html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>');

    // Merge consecutive blockquotes
    html = html.replace(/<\/blockquote>\s*<blockquote>/g, '<br>');

    // Convert GitHub mentions: @username
    html = html.replace(/@(\w+)/g, '<a href="https://github.com/$1" target="_blank">@$1</a>');

    // Convert headers
    html = html.replace(/### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/# (.*$)/gim, '<h1>$1</h1>');

    // Convert bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert links (but not the ones we already converted)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Convert line breaks to paragraphs
    html = html.split('\n\n').map(para => {
        if (!para.trim()) return '';
        if (para.trim().startsWith('<h')) return para;
        if (para.trim().startsWith('<div')) return para;
        if (para.trim().startsWith('<blockquote')) return para;
        if (para.trim().startsWith('<ul>') || para.trim().startsWith('<ol>')) return para;
        return `<p>${para}</p>`;
    }).join('');

    // Convert unordered lists
    html = html.replace(/^\* (.+)$/gim, '<ul><li>$1</li></ul>');
    html = html.replace(/^\- (.+)$/gim, '<ul><li>$1</li></ul>');

    // Merge consecutive ul tags
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Convert code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Convert inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    return html;
}

// Create list card HTML for a fireside (mobile-first, stacked layout)
function createFiresideRow(discussion) {
    const formattedDate = formatDate(discussion.created_at);

    // Parse markdown body for description and derive a short plain-text excerpt
    const parsedBody = parseMarkdown(discussion.body || '');
    const plainText = parsedBody.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const shortDesc = plainText.length > 240 ? `${plainText.slice(0, 240).trim()}…` : plainText;

    // determine video id (use provided or extract from body)
    const videoId = discussion.youtubeId || getYouTubeId(discussion.body || '') || '';
    const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';

    // link to YouTube if we have a video id, otherwise fall back to discussion
    const youtubeUrl = videoId ? `https://youtu.be/${videoId}` : discussion.html_url;

    return `
        <article class="fireside-card" role="article">
            <div class="fireside-thumb">
                ${videoId ? `
                    <a class="thumb-link" href="${youtubeUrl}" target="_blank" rel="noopener noreferrer">
                        <div class="thumb-wrapper">
                            <img src="${thumbUrl}" alt="${discussion.title}" />
                        </div>
                    </a>
                ` : ``}
            </div>

            <div class="fireside-body">
                <h3 class="fireside-title">${videoId ? `<a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer">${discussion.title}</a>` : discussion.title}</h3>
                <div class="channel-row">
                    <div class="channel-name"><a href="${discussion.author.html_url}" target="_blank">@${discussion.author.login}</a></div>
                    <div class="channel-meta">· ${formattedDate}</div>
                </div>
                <p class="desc-text">${shortDesc}</p>
                <div class="desc-links"><a class="view-link" href="${discussion.html_url}" target="_blank" rel="noopener noreferrer">View discussion →</a></div>
            </div>
        </article>
    `;
}

function renderFiresidesTable(firesides) {
    const rows = firesides.map(d => createFiresideRow(d)).join('');
    return `
        <div class="fireside-list">
            ${rows}
        </div>
    `;
}

// Fetch discussions from JSON file
async function fetchFiresides() {
    const contentDiv = document.getElementById('firesides-content');

    try {
        const response = await fetch(FIRESIDES_JSON_URL);

        if (!response.ok) {
            throw new Error(`Failed to load firesides: ${response.status}`);
        }

        const firesides = await response.json();

        if (firesides.length === 0) {
            contentDiv.innerHTML = `
                <div class="error">
                    <p>No firesides found yet. Check back later!</p>
                </div>
            `;
            return;
        }

        // Render firesides as a compact table
        contentDiv.innerHTML = renderFiresidesTable(firesides);

    } catch (error) {
        console.error('Error fetching firesides:', error);
        contentDiv.innerHTML = `
            <div class="error">
                <p>Failed to load firesides: ${error.message}</p>
                <p>You can view them directly on <a href="https://github.com/homebrew-ec-foss/tiramisu/discussions/categories/firesides" target="_blank">
                    GitHub →
                </a></p>
            </div>
        `;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', fetchFiresides);
