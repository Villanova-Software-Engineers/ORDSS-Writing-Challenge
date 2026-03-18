import os
import logging
import firebase_admin
from firebase_admin import credentials, auth
from .config import settings

if os.path.exists("/etc/secrets/firebase-adminsdk.json"):
    firebase_creds_path = "/etc/secrets/firebase-adminsdk.json"
else:
    firebase_creds_path = settings.firebase_cred_path

def initialize_firebase():
    if not firebase_admin._apps:
        if not firebase_creds_path:
            logging.getLogger(__name__).warning(
                "Firebase not initialized: FIREBASE_CRED_PATH is not set."
            )
            return

        if not os.path.exists(firebase_creds_path):
            logging.getLogger(__name__).warning(
                "Firebase not initialized: credentials file not found at %r.",
                firebase_creds_path,
            )
            return

        cred = credentials.Certificate(firebase_creds_path)
        firebase_admin.initialize_app(cred)