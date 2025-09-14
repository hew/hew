#!/usr/bin/env node

/**
 * Script to update README with latest gist
 * Run: node update-gist.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fetchLatestGist() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/users/hew/gists?per_page=1',
      method: 'GET',
      headers: {
        'User-Agent': 'node-script',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const gists = JSON.parse(data);
          if (gists.length > 0) {
            const latest = gists[0];
            resolve({
              title: latest.description || Object.keys(latest.files)[0],
              url: latest.html_url,
              description: latest.description || 'Latest thoughts and explorations'
            });
          } else {
            reject(new Error('No gists found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function updateReadme() {
  try {
    console.log('Fetching latest gist...');
    const gist = await fetchLatestGist();

    const readmePath = path.join(__dirname, 'README.md');
    let content = fs.readFileSync(readmePath, 'utf8');

    // Find and replace content between markers
    const startMarker = '<!-- GIST:START -->';
    const endMarker = '<!-- GIST:END -->';

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
      const newGistSection = `<!-- GIST:START -->
### 📝 [${gist.title}](${gist.url})
*${gist.description}*
<!-- GIST:END -->`;

      content = content.substring(0, startIndex) +
                newGistSection +
                content.substring(endIndex + endMarker.length);

      fs.writeFileSync(readmePath, content);
      console.log('✅ README updated with latest gist:');
      console.log(`   Title: ${gist.title}`);
      console.log(`   URL: ${gist.url}`);
    } else {
      console.error('❌ Could not find GIST markers in README');
    }
  } catch (error) {
    console.error('❌ Error updating README:', error.message);
  }
}

// Run the update
updateReadme();