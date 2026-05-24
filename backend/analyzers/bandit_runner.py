import subprocess
import json

def run_bandit(code_dir: str):
    try:
        # Bandit analyzes Python code for security issues.
        result = subprocess.run(
            ["bandit", "-r", code_dir, "-f", "json"],
            capture_output=True,
            text=True
        )
        # Bandit returns non-zero exit code if issues are found, so we still parse stdout
        if result.stdout:
            data = json.loads(result.stdout)
            return data.get('results', [])
        return []
    except Exception as e:
        print(f"Bandit failed: {e}")
        return []
