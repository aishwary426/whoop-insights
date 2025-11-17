import os
import zipfile
from pathlib import Path

from app.core_config import get_settings

settings = get_settings()

def save_upload_file(user_id: str, upload_id: str, file_obj) -> str:
    folder = Path(settings.upload_dir) / user_id / upload_id
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / "whoop_export.zip"

    with open(path, "wb") as f:
        while True:
            chunk = file_obj.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)

    return str(path)

def unzip_whoop_export(path: str) -> str:
    extract_dir = str(Path(path).parent / "unzipped")
    os.makedirs(extract_dir, exist_ok=True)

    with zipfile.ZipFile(path, "r") as z:
        z.extractall(extract_dir)

    return extract_dir
