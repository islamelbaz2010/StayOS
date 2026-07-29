import re


def mask_pii(text: str) -> str:
    """Mask PII in log strings: emails, Egyptian phone numbers, national IDs."""
    if not text:
        return text

    # Mask email addresses.
    text = re.sub(
        r"[\w.+-]+@[\w-]+\.[\w.-]+",
        lambda m: _mask_email(m.group(0)),
        text,
    )

    # Mask Egyptian phone numbers (+20 1XX XXX XXXX / 01XXXXXXXXX).
    text = re.sub(
        r"(?:\+20\s?\d?\s?)?0?1\d{9}",
        "+20XXXXXXXXXX",
        text,
    )

    # Mask 14-digit Egyptian national IDs.
    text = re.sub(
        r"\b\d{14}\b",
        "XXXXXXXXXXXXXX",
        text,
    )

    return text


def _mask_email(email: str) -> str:
    local, _, domain = email.rpartition("@")
    if len(local) <= 2:
        masked_local = "*" * len(local)
    else:
        masked_local = f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}"
    return f"{masked_local}@{domain}"
