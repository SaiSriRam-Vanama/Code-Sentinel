import httpx
import os

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

def get_github_headers():
    headers = {"Accept": "application/vnd.github.v3.diff"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers

async def fetch_pr_diff(repo_owner: str, repo_name: str, pr_number: int):
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/pulls/{pr_number}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=get_github_headers())
        response.raise_for_status()
        return response.text
