from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import asyncio
from pathlib import Path

from backend.database.database import engine, Base, get_db, SessionLocal
from backend.database.models import PullRequest, ReviewIssue
from backend.github_service import fetch_pr_diff
from backend.ai_review import analyze_code_diff

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# We already created tables in models.py but doing it here ensures it's ready.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CodeSentinel API")

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    repo_owner: str
    repo_name: str
    pr_number: int

@app.get("/")
def read_root():
    return {"message": "Welcome to CodeSentinel API"}

async def process_analysis(pr_id: int, repo_owner: str, repo_name: str, pr_number: int):
    db = SessionLocal()
    try:
        # 1. Fetch Diff
        diff = await fetch_pr_diff(repo_owner, repo_name, pr_number)
        
        # 2. Run Static Analysis (Dummy results for now since we don't have local repo clone)
        # Ideally, we would clone the repo, run semgrep/bandit, and pass results.
        static_analysis_results = {
            "semgrep": [],
            "bandit": []
        }
        
        # 3. AI Review
        ai_result = await analyze_code_diff(diff, static_analysis_results)
        
        # 4. Save to DB
        pr = db.query(PullRequest).filter(PullRequest.id == pr_id).first()
        if pr:
            pr.security_score = ai_result.get("security_score", 0)
            pr.performance_score = ai_result.get("performance_score", 0)
            pr.maintainability_score = ai_result.get("maintainability_score", 0)
            pr.overall_risk = ai_result.get("overall_risk", "UNKNOWN")
            pr.issues_found = ai_result.get("issues_found", 0)
            pr.status = "completed"

            for issue_data in ai_result.get("issues", []):
                issue = ReviewIssue(
                    pr_id=pr.id,
                    issue_type=issue_data.get("type"),
                    title=issue_data.get("title"),
                    severity=issue_data.get("severity"),
                    explanation=issue_data.get("description"),
                    suggested_fix=issue_data.get("suggested_fix"),
                    improved_code=issue_data.get("improved_code"),
                    file_path=issue_data.get("file", ""),
                    line_number=issue_data.get("line", 0),
                    confidence=issue_data.get("confidence"),
                    impact=issue_data.get("impact")
                )
                db.add(issue)
            db.commit()
    except Exception as e:
        print(f"Analysis failed: {e}")
        pr = db.query(PullRequest).filter(PullRequest.id == pr_id).first()
        if pr:
            pr.status = "failed"
            db.commit()
    finally:
        db.close()


@app.post("/api/analyze")
async def trigger_analysis(request: AnalyzeRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Check if already exists
    pr = db.query(PullRequest).filter(
        PullRequest.repo_url == f"{request.repo_owner}/{request.repo_name}",
        PullRequest.pr_number == request.pr_number
    ).first()
    
    if not pr:
        pr = PullRequest(
            repo_url=f"{request.repo_owner}/{request.repo_name}",
            pr_number=request.pr_number,
            status="analyzing"
        )
        db.add(pr)
        db.commit()
        db.refresh(pr)
    else:
        pr.status = "analyzing"
        db.query(ReviewIssue).filter(ReviewIssue.pr_id == pr.id).delete()
        db.commit()
    
    background_tasks.add_task(process_analysis, pr.id, request.repo_owner, request.repo_name, request.pr_number)
    return {"message": "Analysis started", "pr_id": pr.id}

@app.get("/api/pr/{pr_id}")
def get_pr_status(pr_id: int, db: Session = Depends(get_db)):
    pr = db.query(PullRequest).filter(PullRequest.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    
    issues = db.query(ReviewIssue).filter(ReviewIssue.pr_id == pr.id).all()
    return {"pr": pr, "issues": issues}

@app.get("/api/prs")
def list_prs(db: Session = Depends(get_db)):
    prs = db.query(PullRequest).order_by(PullRequest.id.desc()).all()
    return prs
