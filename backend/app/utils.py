import secrets
import string


_ALPHABET = string.ascii_uppercase + string.digits


def generate_access_code(length: int = 8) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))

