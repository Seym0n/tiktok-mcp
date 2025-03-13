# <img src="https://cdn.worldvectorlogo.com/logos/tiktok-icon-2.svg" height="32"> TikTok MCP

![image (12)](https://github.com/user-attachments/assets/006f9983-b9dd-447c-87c6-ee27a414fd4c)


The TikTok MCP integrates TikTok access into Claude AI and other apps via TikNeuron. This TikTok MCP allows you to
- analyze TikTok videos to determine virality factors
- get content from TikTok videos
- chat with TikTok videos

## Available Tools

### tiktok_available_subtitles

**Description:**  
Looks up the available subtitle, i.e., content for a TikTok video. This is used for looking up if there is any content (subtitle) available to a TikTok video. Returns the available subtitle for the video which can be in different languages and different formats like Automatic Speech Recognition, Machine Translation or Creator Captions and different languages.

**Input Parameters:**
- `tiktok_url` (required): TikTok video URL, e.g., https://www.tiktok.com/@username/video/1234567890 or https://vm.tiktok.com/1234567890

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
- Creator username
- Hashtags
- Number of likes, shares, comments, views and bookmarks
- Date of creation
- Duration of the video

**Input Parameters:**
- `tiktok_url` (required): TikTok video URL, e.g., https://www.tiktok.com/@username/video/1234567890 or https://vm.tiktok.com/1234567890

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
