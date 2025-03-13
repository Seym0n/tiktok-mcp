#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";

const AVAILABLE_SUBTITLES: Tool = {
    name: "tiktok_available_subtitles",
    description:
        "Looks up the available subtitle, i.e., content for a TikTok video." +
        "This is used for looking up if there is any content (subtitle) available to a TikTok video." +
        "Supports TikTok video url as input in object" +
        "Returns the available subtitle for the video which can be in different languages and different" +
        "formats like Automatic Speech Recognition, Machine Translation or Creator Captions" +
        "and different languages.",
    inputSchema: {
        type: "object",
        properties: {
            tiktok_url: {
                type: "string",
                description: "TikTok video URL, e.g., https://www.tiktok.com/@username/video/1234567890 or https://vm.tiktok.com/1234567890",
            },
        },
        required: ["tiktok_url"],
    },
};

const GET_SUBTITLE: Tool = {
    name: "tiktok_get_subtitle",
    description:
        "Get the subtitle (content) for a TikTok video url." +
        "This is used for getting the subtitle, content or context for a TikTok video." +
        "Supports TikTok video url as input and optionally language code from tool 'AVAILABLE_SUBTITLES'" +
        "Returns the subtitle for the video in the requested language and format." +
        "If no language code is provided, the tool will return the subtitle of automatic speech recognition.",
    inputSchema: {
        type: "object",
        properties: {
            tiktok_url: {
                type: "string",
                description: "TikTok video URL, e.g., https://www.tiktok.com/@username/video/1234567890 or https://vm.tiktok.com/1234567890",
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
        "Supports TikTok video url as input." +
        "Returns the details of the video like" +
        " - Description" +
        " - Creator username" +
        " - Hashtags" + 
        " - Number of likes, shares, comments, views and bookmarks" +
        " - Date of creation" +
        " - Duration of the video",
    inputSchema: {
        type: "object",
        properties: {
            tiktok_url: {
                type: "string",
                description: "TikTok video URL, e.g., https://www.tiktok.com/@username/video/1234567890 or https://vm.tiktok.com/1234567890",
            },
        },
        required: ["tiktok_url"],
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

interface AvailableSubtitle {
    success?: boolean;
    subtitles?: Array<{
        language?: string;
        source?: string;
    }>;
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
        creator: string;
        hashtags: string[];
        likes: string;  // Note: These are strings, not numbers
        shares: string;
        comments: string;
        views: string;
        bookmarks: string;
        created_at: string;
        duration: number;
    };
}


function isAvailableSubtitleArgs(args: unknown): args is { tiktok_url: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "tiktok_url" in args &&
        typeof (args as { tiktok_url: string }).tiktok_url === "string"
    );
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

async function performAvailableSubtitle(tiktok_url: string) {
    const url = new URL('https://tikneuron.com/api/mcp/available-subtitles');
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


    const data = await response.json() as AvailableSubtitle;


    return data.subtitles?.map(subtitle => {
        return `Language: ${subtitle.language}\nSource: ${subtitle.source}`;
    }).join('\n\n') || 'No subtitles available';
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
    Creator: ${details.creator || 'N/A'}
    Hashtags: ${Array.isArray(details.hashtags) ? details.hashtags.join(', ') : 'N/A'}
    Likes: ${details.likes || '0'}
    Shares: ${details.shares || '0'}
    Comments: ${details.comments || '0'}
    Views: ${details.views || '0'}
    Bookmarks: ${details.bookmarks || '0'}
    Created at: ${details.created_at || 'N/A'}
    Duration: ${details.duration || 0} seconds`;
      } else {
        return 'No details available';
      }
}


// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [AVAILABLE_SUBTITLES, GET_SUBTITLE, GET_POST_DETAILS],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        if (!args) {
            throw new Error("No arguments provided");
        }

        switch (name) {
            case "tiktok_available_subtitles": {

                if (!isAvailableSubtitleArgs(args)) {
                    throw new Error("Invalid arguments for tiktok_available_subtitles");
                }
                const { tiktok_url } = args;

                const results = await performAvailableSubtitle(tiktok_url);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

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