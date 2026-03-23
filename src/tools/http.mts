/**
 * HTTP tool - generic HTTP requests
 */
import { Type } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";

export function createHttpTool(): AgentTool {
	const params = Type.Object({
		url: Type.String({ description: "URL to request" }),
		method: Type.Optional(
			Type.String({ description: "HTTP method (default: GET)" })
		),
		headers: Type.Optional(
			Type.Record(Type.String(), Type.String(), {
				description: "HTTP headers",
			})
		),
		body: Type.Optional(Type.String({ description: "Request body" })),
	});

	return {
		name: "http_request",
		label: "HTTP Request",
		description:
			"Make a generic HTTP request. Supports GET, POST, PUT, DELETE, etc.",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const method = args.method || "GET";
				const headers = args.headers || {};

				const response = await fetch(args.url, {
					method,
					headers,
					body: args.body,
				});

				const responseText = await response.text();

				// Try to parse as JSON
				let parsedBody: any;
				try {
					parsedBody = JSON.parse(responseText);
				} catch {
					parsedBody = responseText;
				}

				const result = {
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					body: parsedBody,
				};

				return {
					content: [
						{
							type: "text",
							text: `HTTP ${method} ${args.url}\nStatus: ${response.status} ${response.statusText}\n\n${JSON.stringify(parsedBody, null, 2)}`,
						},
					],
					details: result,
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `HTTP request failed: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}
