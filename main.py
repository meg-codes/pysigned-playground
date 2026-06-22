import random
import secrets
from datetime import datetime, UTC
from pathlib import Path

from fastapi import FastAPI, Request, Depends
from fastapi.responses import FileResponse
from pysigned import URLAuth
from pysigned.extensions.fastapi import SignedRoute

app = FastAPI()
app.frontend("/", directory=Path("frontend/dist"))

key = secrets.token_bytes(64)
signer = URLAuth([key])
dep = SignedRoute(keyset=[key])

resources = {
    "apollo_11.jpg": FileResponse(
        path=Path("static/apollo_11.jpg"),
        media_type="image/jpeg",
    ),
    "velocipede.jpg": FileResponse(
        path=Path("static/velocipede.jpg"), media_type="image/jpeg"
    ),
    "now": {"now": datetime.now(UTC).isoformat()},
    "boo": {"ghost": "BOO!"},
}


def random_resource() -> str:
    return random.choice([k for k in resources.keys()])


@app.get("/signed")
def random_signed_url(request: Request):
    resource_name = random_resource()

    to_be_signed = f"{request.url.scheme}://{request.url.hostname}{(':' + str(request.url.port).lstrip(':'))}/samples/{resource_name}"
    return {"signed": signer.sign(to_be_signed)}


@app.get("/samples/{resource}", dependencies=[Depends(dep)])
async def sample_resource(resource: str):
    return resources[resource]
