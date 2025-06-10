#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";


const GET_SUBTITLE: Tool = {
    name: "tiktok_get_subtitle",
    description:
        "Get the subtitle (content) for a TikTok video url." +
        "This is used for getting the subtitle, content or context for a TikTok video." +
        "Supports TikTok video url (or video ID) as input and optionally language code from the tool post details" +
        "Returns the subtitle for the video in the requested language and format." +
        "If no language code is provided, the tool will return the subtitle of automatic speech recognition.",
    inputSchema: {
        type: "object",
        properties: {
            tiktok_url: {
                type: "string",
                description: "TikTok video URL, e.g., https://www.tiktok.com/@username/video/1234567890 or https://vm.tiktok.com/1234567890, or just the video ID like 7409731702890827041",
            },
            language_code: {
                type: "string",
                description: "Language code for the subtitle, e.g., en for English, es for Spanish, fr for French, etc.",
            },
        },
        required: ["tiktok_url"]
    }
};

const GET_POST_DETAILS: Tool = {
    name: "tiktok_get_post_details",
    description:
        "Get the details of a TikTok post." +
        "This is used for getting the details of a TikTok post." +
        "Supports TikTok video url (or video ID) as input." +
        "Returns the details of the video like" +
        " - Description" +
        " - Video ID" +
        " - Creator username" +
        " - Hashtags" + 
        " - Number of likes, shares, comments, views and bookmarks" +
        " - Date of creation" +
        " - Duration of the video" +
        " - Available subtitles with language and source information",
    inputSchema: {
        type: "object",
        properties: {
            tiktok_url: {
                type: "string",
                description: "TikTok video URL, e.g., https://www.tiktok.com/@username/video/1234567890 or https://vm.tiktok.com/1234567890, or just the video ID like 7409731702890827041",
            },
        },
        required: ["tiktok_url"],
    },
};

const SEARCH: Tool = {
    name: "tiktok_search",
    description:
        "Search for TikTok videos based on a query." +
        "This is used for searching TikTok videos by keywords, hashtags, or other search terms." +
        "Supports search query as input and optional cursor and search_uid for pagination." +
        "Returns a list of videos matching the search criteria with their details including" +
        " - Description, video ID, creator, hashtags, engagement metrics, date of creation, duration of the video and available subtitles with language and source information" +
        " - Pagination metadata for continuing the search",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Search query for TikTok videos, e.g., 'funny cats', 'dance', 'cooking tutorial'",
            },
            cursor: {
                type: "string",
                description: "Pagination cursor for getting more results (optional)",
            },
            search_uid: {
                type: "string",
                description: "Search session identifier for pagination (optional)",
            },
        },
        required: ["query"],
    },
};

// Server implementation
const server = new Server(
    {
        name: "tikneuron/tiktok-mcp",
        version: "0.1.0",
    },
    {
        capabilities: {
            tools: {},
        },
    },
);

// Check for API key
const TIKNEURON_MCP_API_KEY = process.env.TIKNEURON_MCP_API_KEY!;
if (!TIKNEURON_MCP_API_KEY) {
    console.error("Error: TIKNEURON_MCP_API_KEY environment variable is required");
    process.exit(1);
}


interface Subtitle {
    success?: boolean;
    subtitles?: Array<{
        language?: string;
        source?: string;
    }>;
    subtitle_content?: string;
}

interface PostDetails {
    success: boolean;
    details: {
        description: string;
        video_id: string;
        creator: string;
        hashtags: string[];
        likes: string;
        shares: string;
        comments: string;
        views: string;
        bookmarks: string;
        created_at: string;
        duration: number;
        available_subtitles: Array<{
            language?: string;
            source?: string;
        }>;
    };
}

interface SearchResult {
    success: boolean;
    videos: Array<{
        description: string;
        video_id: string;
        creator: string;
        hashtags: string[];
        likes: string;
        shares: string;
        comments: string;
        views: string;
        bookmarks: string;
        created_at: string;
        duration: number;
        available_subtitles: Array<{
            language?: string;
            source?: string;
        }>;
    }>;
    metadata: {
        cursor: string;
        has_more: boolean;
        search_uid: string;
    };
}



function isGetSubtitleArgs(args: unknown): args is { tiktok_url: string, language_code: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "tiktok_url" in args &&
        typeof (args as { tiktok_url: string }).tiktok_url === "string"
    );
}

function isGetPostDetailsArgs(args: unknown): args is { tiktok_url: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "tiktok_url" in args &&
        typeof (args as { tiktok_url: string }).tiktok_url === "string"
    );
}

function isSearchArgs(args: unknown): args is { query: string, cursor?: string, search_uid?: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "query" in args &&
        typeof (args as { query: string }).query === "string" &&
        ("cursor" in args ? typeof (args as { cursor?: string }).cursor === "string" : true) &&
        ("search_uid" in args ? typeof (args as { search_uid?: string }).search_uid === "string" : true)
    );
}

async function performSearch(query: string, cursor?: string, search_uid?: string) {
    const url = new URL('https://tikneuron.com/api/mcp/search');
    url.searchParams.set('query', query);
    
    if (cursor) {
        url.searchParams.set('cursor', cursor);
    }
    
    if (search_uid) {
        url.searchParams.set('search_uid', search_uid);
    }

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'MCP-API-KEY': TIKNEURON_MCP_API_KEY,
        }
    });

    if (!response.ok) {
        throw new Error(`TikNeuron API error: ${response.status} ${response.statusText}\n${await response.text()}`);
    }

    const data = await response.json() as SearchResult;

    if (data.videos && data.videos.length > 0) {
        const videosList = data.videos.map((video, index) => {
            return `Video ${index + 1}:
Description: ${video.description || 'N/A'}
Video ID: ${video.video_id || 'N/A'}
Creator: ${video.creator || 'N/A'}
Hashtags: ${Array.isArray(video.hashtags) ? video.hashtags.join(', ') : 'N/A'}
Likes: ${video.likes || '0'}
Shares: ${video.shares || '0'}
Comments: ${video.comments || '0'}
Views: ${video.views || '0'}
Bookmarks: ${video.bookmarks || '0'}
Created at: ${video.created_at || 'N/A'}
Duration: ${video.duration || 0} seconds
Available subtitles: ${video.available_subtitles?.map(sub => `${sub.language || 'Unknown'} (${sub.source || 'Unknown source'})`).join(', ') || 'None'}`;
        }).join('\n\n');

        const metadata = `\nSearch Metadata:
Cursor: ${data.metadata?.cursor || 'N/A'}
Has more results: ${data.metadata?.has_more ? 'Yes' : 'No'}
Search UID: ${data.metadata?.search_uid || 'N/A'}`;

        return videosList + metadata;
    } else {
        return 'No videos found for the search query';
    }
}

async function performGetSubtitle(tiktok_url: string, language_code: string) {
    const url = new URL('https://tikneuron.com/api/mcp/get-subtitles');
    url.searchParams.set('tiktok_url', tiktok_url);

    if (language_code){
        url.searchParams.set('language_code', language_code);
    }

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'MCP-API-KEY': TIKNEURON_MCP_API_KEY,
        }
    });

    if (!response.ok) {
        throw new Error(`TikNeuron API error: ${response.status} ${response.statusText}\n${await response.text()}`);
    }

    const data = await response.json() as Subtitle;

    return data.subtitle_content || 'No subtitle available';
}

async function performGetPostDetails(tiktok_url: string) {
    const url = new URL('https://tikneuron.com/api/mcp/post-detail');
    url.searchParams.set('tiktok_url', tiktok_url);

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'MCP-API-KEY': TIKNEURON_MCP_API_KEY,
        }
    });

    if (!response.ok) {
        throw new Error(`TikNeuron API error: ${response.status} ${response.statusText}\n${await response.text()}`);
    }

    const data = await response.json() as PostDetails;

    if (data.details) {
        const details = data.details;
        return `Description: ${details.description || 'N/A'}
    Video ID: ${details.video_id || 'N/A'}
    Creator: ${details.creator || 'N/A'}
    Hashtags: ${Array.isArray(details.hashtags) ? details.hashtags.join(', ') : 'N/A'}
    Likes: ${details.likes || '0'}
    Shares: ${details.shares || '0'}
    Comments: ${details.comments || '0'}
    Views: ${details.views || '0'}
    Bookmarks: ${details.bookmarks || '0'}
    Created at: ${details.created_at || 'N/A'}
    Duration: ${details.duration || 0} seconds
    Available subtitles: ${details.available_subtitles?.map(sub => `${sub.language || 'Unknown'} (${sub.source || 'Unknown source'})`).join(', ') || 'None'}`;
      } else {
        return 'No details available';
      }
}


// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [GET_SUBTITLE, GET_POST_DETAILS, SEARCH],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        if (!args) {
            throw new Error("No arguments provided");
        }

        switch (name) {
            case "tiktok_get_subtitle": {
                if (!isGetSubtitleArgs(args)) {
                    throw new Error("Invalid arguments for tiktok_get_subtitle");
                }
                const { tiktok_url, language_code } = args;

                const results = await performGetSubtitle(tiktok_url, language_code);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

            case "tiktok_get_post_details": {
                if (!isGetPostDetailsArgs(args)) {
                    throw new Error("Invalid arguments for tiktok_get_post_details");
                }
                const { tiktok_url } = args;

                const results = await performGetPostDetails(tiktok_url);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

            case "tiktok_search": {
                if (!isSearchArgs(args)) {
                    throw new Error("Invalid arguments for tiktok_search");
                }
                const { query, cursor, search_uid } = args;

                const results = await performSearch(query, cursor, search_uid);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

            default:
                return {
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("TikTok MCP Server running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});