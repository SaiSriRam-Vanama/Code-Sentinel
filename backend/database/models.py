from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from backend.database.database import Base, engine

class PullRequest(Base):
    __tablename__ = "pull_requests"

    id = Column(Integer, primary_key=True, index=True)
    repo_url = Column(String, index=True)
    pr_number = Column(Integer, index=True)
    status = Column(String, default="pending")  # pending, analyzing, completed, failed
    security_score = Column(Float, nullable=True)
    performance_score = Column(Float, nullable=True)
    maintainability_score = Column(Float, nullable=True)
    overall_risk = Column(String, nullable=True)
    issues_found = Column(Integer, default=0)

class ReviewIssue(Base):
    __tablename__ = "review_issues"

    id = Column(Integer, primary_key=True, index=True)
    pr_id = Column(Integer, ForeignKey("pull_requests.id"))
    issue_type = Column(String)       # from "type"
    title = Column(String, nullable=True)  # from "title"
    severity = Column(String)         # HIGH, MEDIUM, LOW
    explanation = Column(Text)        # from "description"
    suggested_fix = Column(Text)
    improved_code = Column(Text, nullable=True)
    file_path = Column(String)        # from "file"
    line_number = Column(Integer, nullable=True)  # from "line"
    confidence = Column(Float, nullable=True)
    impact = Column(Text, nullable=True)

# Create all tables on fresh DB
Base.metadata.create_all(bind=engine)
