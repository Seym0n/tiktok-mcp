# <img src="https://cdn.worldvectorlogo.com/logos/tiktok-icon-2.svg" height="32"> TikTok MCP
[![Trust Score](https://archestra.ai/mcp-catalog/api/badge/quality/Seym0n/tiktok-mcp)](https://archestra.ai/mcp-catalog/seym0n__tiktok-mcp)

![image (12)](https://github.com/user-attachments/assets/006f9983-b9dd-447c-87c6-ee27a414fd4c)


The TikTok MCP integrates TikTok access into Claude AI and other apps via TikNeuron. This TikTok MCP allows you to
- analyze TikTok videos to determine virality factors
- get content from TikTok videos
- chat with TikTok videos

## Available Tools

### tiktok_get_subtitle

**Description:**  
Get the subtitle (content) for a TikTok video url. This is used for getting the subtitle, content or context for a TikTok video. If no language code is provided, the tool will return the subtitle of automatic speech recognition.

**Input Parameters:**
- `tiktok_url` (required): TikTok video URL, e.g., https://www.tiktok.com/@username/video/1234567890 or https://vm.tiktok.com/1234567890
- `language_code` (optional): Language code for the subtitle, e.g., en for English, es for Spanish, fr for French, etc.

### tiktok_get_post_details

**Description:**  
Get the details of a TikTok post. Returns the details of the video like:
- Description
- Video ID
- Creator username
- Hashtags
- Number of likes, shares, comments, views and bookmarks
- Date of creation
- Duration of the video
- Available subtitles with language and source information

**Input Parameters:**
- `tiktok_url` (required): TikTok video URL, e.g., https://www.tiktok.com/@username/video/1234567890 or https://vm.tiktok.com/1234567890, or just the video ID like 7409731702890827041

### tiktok_search

**Description:**  
Search for TikTok videos based on a query. Returns a list of videos matching the search criteria with their details including description, video ID, creator, hashtags, engagement metrics, date of creation, duration and available subtitles, plus pagination metadata for continuing the search.

**Input Parameters:**
- `query` (required): Search query for TikTok videos, e.g., 'funny cats', 'dance', 'cooking tutorial'
- `cursor` (optional): Pagination cursor for getting more results
- `search_uid` (optional): Search session identifier for pagination

## Requirements

For this TikTok MCP, you need
- NodeJS v18 or higher (https://nodejs.org/)
- Git (https://git-scm.com/)
- TikNeuron Account and MCP API Key (https://tikneuron.com/tools/tiktok-mcp)

## Setup

1. Clone the repository
```
git clone https://github.com/Seym0n/tiktok-mcp.git
```

2. Install dependencies
```
npm install
```

3. Build project
```
npm run build
```

This creates the file `build\index.js`

## Using in Claude AI

Add the following entry to `mcpServers`:

```
"tiktok-mcp": {
    "command": "node",
    "args": [
      "path\\build\\index.js"
    ],
    "env": {
      "TIKNEURON_MCP_API_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    }
}
```

and replace path with the `path` to TikTok MCP and `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` with TIkNeuron API Key

so that `mcpServers` will look like this:

```
{
  "mcpServers": {
    "tiktok-mcp": {
      "command": "node",
      "args": [
        "path\\build\\index.js"
      ],
      "env": {
        "TIKNEURON_MCP_API_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      }
    }
  }
}
```
