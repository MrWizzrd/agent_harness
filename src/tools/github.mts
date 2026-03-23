/**
 * GitHub tools - PRs, issues, commits, reviews, CI status
 */
import { Type } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";

export function createGitHubTools(githubToken: string): AgentTool<any>[] {
	return [
		createGitHubListPRsTool(githubToken),
		createGitHubGetPRTool(githubToken),
		createGitHubCreateReviewTool(githubToken),
		createGitHubListCommitsTool(githubToken),
		createGitHubGetCIStatusTool(githubToken),
	];
}

function createGitHubListPRsTool(githubToken: string): AgentTool {
	const params = Type.Object({
		owner: Type.String({ description: "Repository owner" }),
		repo: Type.String({ description: "Repository name" }),
		state: Type.Optional(
			Type.String({ description: "PR state: open, closed, all" })
		),
	});

	return {
		name: "github_list_prs",
		label: "List GitHub PRs",
		description: "List pull requests for a repository",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const state = args.state || "open";
				const url = `https://api.github.com/repos/${args.owner}/${args.repo}/pulls?state=${state}`;
				const response = await fetch(url, {
					headers: {
						Authorization: `Bearer ${githubToken}`,
						Accept: "application/vnd.github.v3+json",
					},
				});

				if (!response.ok) {
					throw new Error(`GitHub API error: ${response.statusText}`);
				}

				const prs: any[] = await response.json();

				const formatted = prs
					.map(
						(pr) =>
							`#${pr.number}: ${pr.title} by ${pr.user.login} [${pr.state}]`
					)
					.join("\n");

				return {
					content: [{ type: "text", text: formatted || "No PRs found" }],
					details: { prs },
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to list PRs: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createGitHubGetPRTool(githubToken: string): AgentTool {
	const params = Type.Object({
		owner: Type.String({ description: "Repository owner" }),
		repo: Type.String({ description: "Repository name" }),
		prNumber: Type.Number({ description: "PR number" }),
	});

	return {
		name: "github_get_pr",
		label: "Get GitHub PR",
		description: "Get PR details including diff",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = `https://api.github.com/repos/${args.owner}/${args.repo}/pulls/${args.prNumber}`;
				const response = await fetch(url, {
					headers: {
						Authorization: `Bearer ${githubToken}`,
						Accept: "application/vnd.github.v3.diff",
					},
				});

				if (!response.ok) {
					throw new Error(`GitHub API error: ${response.statusText}`);
				}

				const diff = await response.text();

				return {
					content: [{ type: "text", text: diff }],
					details: { prNumber: args.prNumber },
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to get PR: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createGitHubCreateReviewTool(githubToken: string): AgentTool {
	const params = Type.Object({
		owner: Type.String({ description: "Repository owner" }),
		repo: Type.String({ description: "Repository name" }),
		prNumber: Type.Number({ description: "PR number" }),
		body: Type.String({ description: "Review comment" }),
		event: Type.String({
			description: "Review event: APPROVE, REQUEST_CHANGES, COMMENT",
		}),
	});

	return {
		name: "github_create_review",
		label: "Create GitHub Review",
		description: "Submit a PR review with comments",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = `https://api.github.com/repos/${args.owner}/${args.repo}/pulls/${args.prNumber}/reviews`;
				const response = await fetch(url, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${githubToken}`,
						Accept: "application/vnd.github.v3+json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						body: args.body,
						event: args.event,
					}),
				});

				if (!response.ok) {
					throw new Error(`GitHub API error: ${response.statusText}`);
				}

				const review: any = await response.json();

				return {
					content: [
						{
							type: "text",
							text: `Submitted ${args.event} review for PR #${args.prNumber}`,
						},
					],
					details: review,
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to create review: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createGitHubListCommitsTool(githubToken: string): AgentTool {
	const params = Type.Object({
		owner: Type.String({ description: "Repository owner" }),
		repo: Type.String({ description: "Repository name" }),
		limit: Type.Optional(
			Type.Number({ description: "Number of commits (default: 30)" })
		),
	});

	return {
		name: "github_list_commits",
		label: "List GitHub Commits",
		description: "List recent commits",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const limit = args.limit || 30;
				const url = `https://api.github.com/repos/${args.owner}/${args.repo}/commits?per_page=${limit}`;
				const response = await fetch(url, {
					headers: {
						Authorization: `Bearer ${githubToken}`,
						Accept: "application/vnd.github.v3+json",
					},
				});

				if (!response.ok) {
					throw new Error(`GitHub API error: ${response.statusText}`);
				}

				const commits: any[] = await response.json();

				const formatted = commits
					.map(
						(c) =>
							`${c.sha.slice(0, 7)}: ${c.commit.message.split("\n")[0]} by ${c.commit.author.name}`
					)
					.join("\n");

				return {
					content: [{ type: "text", text: formatted }],
					details: { commits },
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to list commits: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createGitHubGetCIStatusTool(githubToken: string): AgentTool {
	const params = Type.Object({
		owner: Type.String({ description: "Repository owner" }),
		repo: Type.String({ description: "Repository name" }),
		ref: Type.String({ description: "Branch/commit ref" }),
	});

	return {
		name: "github_get_ci_status",
		label: "Get GitHub CI Status",
		description: "Check CI status for a ref",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const url = `https://api.github.com/repos/${args.owner}/${args.repo}/commits/${args.ref}/status`;
				const response = await fetch(url, {
					headers: {
						Authorization: `Bearer ${githubToken}`,
						Accept: "application/vnd.github.v3+json",
					},
				});

				if (!response.ok) {
					throw new Error(`GitHub API error: ${response.statusText}`);
				}

				const status: any = await response.json();

				const formatted = `
Overall Status: ${status.state}
Total Checks: ${status.total_count}

${status.statuses.map((s: any) => `- ${s.context}: ${s.state}`).join("\n")}
`.trim();

				return {
					content: [{ type: "text", text: formatted }],
					details: status,
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to get CI status: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}
