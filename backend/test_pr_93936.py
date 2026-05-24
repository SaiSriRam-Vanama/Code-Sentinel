import httpx
import time

def test_pr():
    print("Triggering API analysis for PR 93936...")
    response = httpx.post("http://localhost:8000/api/analyze", json={
        "repo_owner": "vercel",
        "repo_name": "next.js",
        "pr_number": 93936
    })
    print("Status code:", response.status_code)
    data = response.json()
    print("Response data:", data)
    
    pr_id = data.get("pr_id")
    if not pr_id:
        print("No pr_id returned!")
        return
        
    print(f"Polling status of PR {pr_id}...")
    for _ in range(30):
        time.sleep(2)
        pr_response = httpx.get(f"http://localhost:8000/api/pr/{pr_id}")
        pr_data = pr_response.json()
        status = pr_data["pr"]["status"]
        print(f"Current status: {status}")
        if status in ("completed", "failed"):
            print("Finished!")
            print("Issues found:", pr_data["pr"]["issues_found"])
            print("Issues count in DB list:", len(pr_data["issues"]))
            for issue in pr_data["issues"]:
                print(f"- {issue['severity']}: {issue['title']} in {issue['file_path']}")
            break

if __name__ == "__main__":
    test_pr()
