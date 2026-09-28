import sys
from pathlib import Path

                                                             
if __package__ is None:
    project_root = str(Path(__file__).resolve().parent.parent)
    sys.path.insert(0, project_root)
    sys.path.pop(1)

from fastapi import FastAPI
import uvicorn
from API.home.main import app as api_app

app = api_app












if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=2006)