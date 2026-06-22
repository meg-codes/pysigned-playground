from base64 import urlsafe_b64encode
import random
from datetime import datetime, UTC
from pathlib import Path

from fastapi import FastAPI, Request, Depends
from fastapi.responses import FileResponse
from pysigned import URLAuth, KeySet, Ed25519KeyPair
from pysigned.keys import Key
from pysigned.extensions.fastapi import SignedRoute

app = FastAPI()

keyset = KeySet.from_env("ED25519_KEYPAIRS")

signer = URLAuth(keyset, require_kid=True)
dep = SignedRoute(url_auth=signer)

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


@app.get("/jwks.json")
async def jwks():
    pub_keys = []
    for key in keyset:
        match key:
            case Key():
                pass
            case Ed25519KeyPair():
                raw_pub = key.public_key.public_bytes_raw()
                key_format = {
                    "kty": "OKP",
                    "use": "sig",
                    "crv": "Ed25519",
                    "kid": key.id,
                    "x": urlsafe_b64encode(raw_pub).decode().rstrip("="),
                }
                pub_keys.append(key_format)
    return {"keys": pub_keys}


@app.get("/signed")
async def random_signed_url(request: Request):
    resource_name = random_resource()

    to_be_signed = f"{request.url.scheme}://{request.url.hostname}{(':' + str(request.url.port if request.url.port else '')).rstrip(':')}/samples/{resource_name}"
    return {"signed": signer.sign(to_be_signed)}


@app.get("/samples/{resource}", dependencies=[Depends(dep)])
async def sample_resource(resource: str):
    return resources[resource]
