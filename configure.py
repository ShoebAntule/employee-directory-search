from pathlib import Path
from secrets import token_urlsafe

ROOT = Path(__file__).resolve().parent


def configure():
    destinations = [ROOT / folder / ".env" for folder in ("", "backend", "frontend")]
    if any(path.exists() for path in destinations):
        raise SystemExit("An .env file already exists. Configure the remaining files manually; nothing was overwritten.")

    password = token_urlsafe(24)
    root_env = (ROOT / ".env.example").read_text()
    root_env = root_env.replace("replace_with_a_unique_local_password", password)
    root_env = root_env.replace("replace_with_a_different_root_password", token_urlsafe(32))
    backend_env = (ROOT / "backend/.env.example").read_text()
    backend_env = backend_env.replace("replace_with_your_local_password", password)
    frontend_env = (ROOT / "frontend/.env.example").read_text()

    for path, content in zip(destinations, (root_env, backend_env, frontend_env), strict=True):
        with path.open("x") as file:
            file.write(content)
    print("Created environment files with unique local database passwords.")
    print("Next: docker compose up -d --wait")


if __name__ == "__main__":
    configure()
