/**
 * Jira tools - search, get, create, update, comment, transition
 */
import { Type } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";

export function createJiraTools(
	jiraUrl: string,
	jiraEmail: string,
	jiraToken: string
): AgentTool<any>[] {
	const authHeader = `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString("base64")}`;

	return [
		createJiraSearchTool(jiraUrl, authHeader),
		createJiraGetTicketTool(jiraUrl, authHeader),
		createJiraCreateTicketTool(jiraUrl, authHeader),
		createJiraUpdateTicketTool(jiraUrl, authHeader),
		createJiraAddCommentTool(jiraUrl, authHeader),
		createJiraTransitionTool(jiraUrl, authHeader),
	];
}

function createJiraSearchTool(jiraUrl: string, authHeader: string): AgentTool {
	const params = Type.Object({
		jql: Type.String({ description: "JQL query string" }),
		maxResults: Type.Optional(
			Type.Number({ description: "Maximum results (default: 50)" })
		),
	});

	return {
		name: "jira_search",
		label: "Jira Search",
		description: "Search for Jira tickets using JQL",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = `${jiraUrl}/rest/api/3/search`;
				const response = await fetch(url, {
					method: "POST",
					headers: {
						Authorization: authHeader,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						jql: args.jql,
						maxResults: args.maxResults || 50,
						fields: ["summary", "status", "assignee", "priority", "created"],
					}),
				});

				if (!response.ok) {
					throw new Error(`Jira API error: ${response.statusText}`);
				}

				const data: any = await response.json();

				const formatted = data.issues
					.map((issue: any) => {
						const summary = issue.fields.summary;
						const status = issue.fields.status.name;
						const assignee = issue.fields.assignee?.displayName || "Unassigned";
						return `${issue.key}: ${summary} [${status}] (${assignee})`;
					})
					.join("\n");

				return {
					content: [
						{
							type: "text",
							text: formatted || "No issues found",
						},
					],
					details: { total: data.total, issues: data.issues },
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Jira search failed: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createJiraGetTicketTool(jiraUrl: string, authHeader: string): AgentTool {
	const params = Type.Object({
		issueKey: Type.String({ description: "Issue key (e.g., PROJ-123)" }),
	});

	return {
		name: "jira_get_ticket",
		label: "Get Jira Ticket",
		description: "Get full details of a Jira ticket",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = `${jiraUrl}/rest/api/3/issue/${args.issueKey}`;
				const response = await fetch(url, {
					headers: {
						Authorization: authHeader,
					},
				});

				if (!response.ok) {
					throw new Error(`Jira API error: ${response.statusText}`);
				}

				const issue: any = await response.json();

				const formatted = `
**${issue.key}: ${issue.fields.summary}**

Status: ${issue.fields.status.name}
Priority: ${issue.fields.priority?.name || "None"}
Assignee: ${issue.fields.assignee?.displayName || "Unassigned"}
Reporter: ${issue.fields.reporter?.displayName || "Unknown"}
Created: ${new Date(issue.fields.created).toLocaleDateString()}

Description:
${issue.fields.description || "(no description)"}
`.trim();

				return {
					content: [{ type: "text", text: formatted }],
					details: issue,
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to get ticket: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createJiraCreateTicketTool(jiraUrl: string, authHeader: string): AgentTool {
	const params = Type.Object({
		project: Type.String({ description: "Project key (e.g., PROJ)" }),
		summary: Type.String({ description: "Ticket summary/title" }),
		description: Type.String({ description: "Ticket description" }),
		issueType: Type.Optional(
			Type.String({ description: "Issue type (default: Task)" })
		),
		labels: Type.Optional(
			Type.Array(Type.String(), { description: "Labels to add" })
		),
	});

	return {
		name: "jira_create_ticket",
		label: "Create Jira Ticket",
		description: "Create a new Jira ticket",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = `${jiraUrl}/rest/api/3/issue`;
				const response = await fetch(url, {
					method: "POST",
					headers: {
						Authorization: authHeader,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						fields: {
							project: { key: args.project },
							summary: args.summary,
							description: args.description,
							issuetype: { name: args.issueType || "Task" },
							labels: args.labels || [],
						},
					}),
				});

				if (!response.ok) {
					const errorData = await response.text();
					throw new Error(
						`Jira API error: ${response.statusText} - ${errorData}`
					);
				}

				const result: any = await response.json();

				return {
					content: [
						{
							type: "text",
							text: `Created ticket ${result.key}: ${args.summary}`,
						},
					],
					details: result,
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to create ticket: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createJiraUpdateTicketTool(jiraUrl: string, authHeader: string): AgentTool {
	const params = Type.Object({
		issueKey: Type.String({ description: "Issue key (e.g., PROJ-123)" }),
		fields: Type.Record(Type.String(), Type.Any(), {
			description: "Fields to update (e.g., {summary: 'New title'})",
		}),
	});

	return {
		name: "jira_update_ticket",
		label: "Update Jira Ticket",
		description: "Update fields on a Jira ticket",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = `${jiraUrl}/rest/api/3/issue/${args.issueKey}`;
				const response = await fetch(url, {
					method: "PUT",
					headers: {
						Authorization: authHeader,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ fields: args.fields }),
				});

				if (!response.ok) {
					throw new Error(`Jira API error: ${response.statusText}`);
				}

				return {
					content: [
						{
							type: "text",
							text: `Updated ticket ${args.issueKey}`,
						},
					],
					details: { issueKey: args.issueKey },
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to update ticket: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createJiraAddCommentTool(jiraUrl: string, authHeader: string): AgentTool {
	const params = Type.Object({
		issueKey: Type.String({ description: "Issue key (e.g., PROJ-123)" }),
		comment: Type.String({ description: "Comment text" }),
	});

	return {
		name: "jira_add_comment",
		label: "Add Jira Comment",
		description: "Add a comment to a Jira ticket",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = `${jiraUrl}/rest/api/3/issue/${args.issueKey}/comment`;
				const response = await fetch(url, {
					method: "POST",
					headers: {
						Authorization: authHeader,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						body: args.comment,
					}),
				});

				if (!response.ok) {
					throw new Error(`Jira API error: ${response.statusText}`);
				}

				return {
					content: [
						{
							type: "text",
							text: `Added comment to ${args.issueKey}`,
						},
					],
					details: { issueKey: args.issueKey },
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to add comment: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createJiraTransitionTool(jiraUrl: string, authHeader: string): AgentTool {
	const params = Type.Object({
		issueKey: Type.String({ description: "Issue key (e.g., PROJ-123)" }),
		transition: Type.String({
			description: "Transition name or ID (e.g., 'In Progress')",
		}),
	});

	return {
		name: "jira_transition",
		label: "Transition Jira Ticket",
		description: "Move a Jira ticket to a different status",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				// First get available transitions
				const transitionsUrl = `${jiraUrl}/rest/api/3/issue/${args.issueKey}/transitions`;
				const transitionsResponse = await fetch(transitionsUrl, {
					headers: {
						Authorization: authHeader,
					},
				});

				if (!transitionsResponse.ok) {
					throw new Error(`Jira API error: ${transitionsResponse.statusText}`);
				}

				const transitionsData: any = await transitionsResponse.json();
				const transition = transitionsData.transitions.find(
					(t: any) => t.name === args.transition || t.id === args.transition
				);

				if (!transition) {
					throw new Error(
						`Transition '${args.transition}' not available for this issue`
					);
				}

				// Perform transition
				const url = `${jiraUrl}/rest/api/3/issue/${args.issueKey}/transitions`;
				const response = await fetch(url, {
					method: "POST",
					headers: {
						Authorization: authHeader,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						transition: { id: transition.id },
					}),
				});

				if (!response.ok) {
					throw new Error(`Jira API error: ${response.statusText}`);
				}

				return {
					content: [
						{
							type: "text",
							text: `Transitioned ${args.issueKey} to ${transition.name}`,
						},
					],
					details: { issueKey: args.issueKey, transition: transition.name },
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to transition ticket: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}
