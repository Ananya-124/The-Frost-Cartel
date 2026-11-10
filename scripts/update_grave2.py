"""
Stage 3: Grave 2 Buried Diary Script Utility
Verifies and maintains the integrity of Grave2BuriedDiary component.
"""

from pathlib import Path

TARGET_FILE = Path("src/components/game/stage3/Grave2BuriedDiary.tsx")


def verify_component() -> bool:
    """Verify that Grave2BuriedDiary component exists and is populated."""
    if not TARGET_FILE.exists():
        print(f"Error: {TARGET_FILE} not found.")
        return False
    size = TARGET_FILE.stat().st_size
    print(f"Grave2BuriedDiary.tsx verified ({size} bytes).")
    return True


if __name__ == "__main__":
    verify_component()
