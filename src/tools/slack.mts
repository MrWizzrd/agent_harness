/**
 * Slack tools - read channels, post messages, search, get thread
 */
import { Type } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";

export function createSlackTools(slackToken: string): AgentTool<any>[] {
	return [
		createSlackReadChannelTool(slackToken),
		createSlackPostMessageTool(slackToken),
		createSlackSearchTool(slackToken),
		createSlackGetThreadTool(slackToken),
	];
}

function createSlackReadChannelTool(slackToken: string): AgentTool {
	const params = Type.Object({
		channel: Type.String({ description: "Channel ID or name" }),
		limit: Type.Optional(
			Type.Number({ description: "Number of messages (default: 100)" })
		),
	});

	return {
		name: "slack_read_channel",
		label: "Read Slack Channel",
		description: "Read recent messages from a Slack channel",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = "https://slack.com/api/conversations.history";
				const response = await fetch(url, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${slackToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						channel: args.channel,
						limit: args.limit || 100,
					}),
				});

				const data: any = await response.json();

				if (!data.ok) {
					throw new Error(`Slack API error: ${data.error}`);
				}

				const formatted = data.messages
					.reverse()
					.map((msg: any) => `[${new Date(parseFloat(msg.ts) * 1000).toISOString()}] ${msg.user}: ${msg.text}`)
					.join("\n");

				return {
					content: [{ type: "text", text: formatted }],
					details: { messages: data.messages },
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to read channel: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createSlackPostMessageTool(slackToken: string): AgentTool {
	const params = Type.Object({
		channel: Type.String({ description: "Channel ID or name" }),
		text: Type.String({ description: "Message text" }),
	});

	return {
		name: "slack_post_message",
		label: "Post Slack Message",
		description: "Post a message to a Slack channel",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = "https://slack.com/api/chat.postMessage";
				const response = await fetch(url, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${slackToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						channel: args.channel,
						text: args.text,
					}),
				});

				const data: any = await response.json();

				if (!data.ok) {
					throw new Error(`Slack API error: ${data.error}`);
				}

				return {
					content: [
						{
							type: "text",
							text: `Posted message to ${args.channel}`,
						},
					],
					details: data,
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to post message: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createSlackSearchTool(slackToken: string): AgentTool {
	const params = Type.Object({
		query: Type.String({ description: "Search query" }),
	});

	return {
		name: "slack_search",
		label: "Search Slack",
		description: "Search messages across Slack workspace",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = `https://slack.com/api/search.messages?query=${encodeURIComponent(args.query)}`;
				const response = await fetch(url, {
					headers: {
						Authorization: `Bearer ${slackToken}`,
					},
				});

				const data: any = await response.json();

				if (!data.ok) {
					throw new Error(`Slack API error: ${data.error}`);
				}

				const formatted = data.messages.matches
					.map((msg: any) => `[${msg.channel.name}] ${msg.username}: ${msg.text}`)
					.join("\n");

				return {
					content: [{ type: "text", text: formatted || "No results" }],
					details: data,
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Search failed: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createSlackGetThreadTool(slackToken: string): AgentTool {
	const params = Type.Object({
		channel: Type.String({ description: "Channel ID" }),
		timestamp: Type.String({ description: "Thread timestamp" }),
	});

	return {
		name: "slack_get_thread",
		label: "Get Slack Thread",
		description: "Get full thread of replies",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = "https://slack.com/api/conversations.replies";
				const response = await fetch(url, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${slackToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						channel: args.channel,
						ts: args.timestamp,
					}),
				});

				const data: any = await response.json();

				if (!data.ok) {
					throw new Error(`Slack API error: ${data.error}`);
				}

				const formatted = data.messages
					.map((msg: any) => `[${new Date(parseFloat(msg.ts) * 1000).toISOString()}] ${msg.user}: ${msg.text}`)
					.join("\n");

				return {
					content: [{ type: "text", text: formatted }],
					details: data,
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to get thread: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}
