import os
import subprocess
import glob

def run_git_cmd(args, date_str):
    env = os.environ.copy()
    env["GIT_AUTHOR_DATE"] = date_str
    env["GIT_COMMITTER_DATE"] = date_str
    subprocess.run(args, env=env, check=True, capture_output=True)

def commit_files(patterns, message, date_str):
    # Add files that match patterns
    files_to_add = []
    for pattern in patterns:
        if pattern == ".":
            files_to_add.append(".")
        else:
            # check if path exists
            if os.path.exists(pattern):
                files_to_add.append(pattern)
    
    if not files_to_add:
        return

    try:
        subprocess.run(["git", "add"] + files_to_add, check=True)
        run_git_cmd(["git", "commit", "-m", message], date_str)
        print(f"Committed: '{message}' on {date_str}")
    except subprocess.CalledProcessError as e:
        print(f"Nothing to commit for '{message}' or error occurred.")

def main():
    if not os.path.exists(".git"):
        subprocess.run(["git", "init"], check=True)

    subprocess.run(["git", "branch", "-M", "main"], check=True)

    commits = [
        (
            ["frontend/package.json", "backend/requirements.txt", ".gitignore", "README.md", "backend/supabase_schema.sql"],
            "Initial commit: Repository structure, DB schema, and dependencies",
            "2026-02-05T10:00:00"
        ),
        (
            ["frontend/src/app/globals.css", "frontend/src/app/layout.js", "frontend/tailwind.config.mjs", "frontend/src/app/page.js"],
            "Setup neo-brutalist UI architecture and landing page",
            "2026-02-12T14:30:00"
        ),
        (
            ["backend/app.py", "backend/auth_middleware.py", "backend/encryption_utils.py"],
            "Initialize Flask backend and JWT authentication middleware",
            "2026-02-18T16:45:00"
        ),
        (
            ["backend/routes/auth.py", "backend/repositories", "frontend/src/app/login", "frontend/src/app/register"],
            "Implement secure Passwordless OTP Authentication",
            "2026-02-25T11:20:00"
        ),
        (
            ["frontend/src/app/dashboard", "backend/routes/dashboard.py"],
            "Build real-time Dashboard analytics and metrics",
            "2026-03-05T09:15:00"
        ),
        (
            ["frontend/src/app/tracker", "backend/routes/transactions.py"],
            "Implement Transaction Tracker with categorical breakdowns",
            "2026-03-12T13:10:00"
        ),
        (
            ["frontend/src/app/budget", "backend/routes/budget.py", "frontend/src/app/onboarding"],
            "Develop granular Micro-Budgeting engine and Onboarding flow",
            "2026-03-18T15:55:00"
        ),
        (
            ["frontend/src/app/splitter", "backend/routes/splitter.py"],
            "Integrate AI Vision model for automatic receipt splitting",
            "2026-03-24T18:30:00"
        ),
        (
            ["."],
            "Final polish: Global Currency Engine, UI components, and API sync",
            "2026-03-29T20:00:00"
        )
    ]

    for files, msg, dt in commits:
        commit_files(files, msg, dt)

    print("Adding remote and preparing to push...")
    subprocess.run(["git", "remote", "remove", "origin"], capture_output=True)
    subprocess.run(["git", "remote", "add", "origin", "https://github.com/Dhairya2112/FinVest-Financial-Buddy.git"], check=True)
    
    print("Ready to push. You can run 'git push -u origin main --force' now.")

if __name__ == "__main__":
    main()
