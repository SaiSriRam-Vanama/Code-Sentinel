import subprocess
import json
import os

def run_semgrep(code_dir: str):
    # Semgrep requires the target code to be present in the filesystem.
    # We will write the fetched diff/code to a temporary file/dir and scan it.
    try:
        # Using a basic semgrep ruleset for demonstration. 
        # In a real scenario, you'd specify a specific ruleset like p/python or p/security-audit
        result = subprocess.run(
            ["semgrep", "scan", "--config=p/default", "--json", code_dir],
            capture_output=True,
            text=True
        )
        if result.stdout:
            data = json.loads(result.stdout)
            return data.get('results', [])
        return []
    except Exception as e:
        print(f"Semgrep failed: {e}")
        return []
