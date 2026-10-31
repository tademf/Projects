"""
NEXUS Remote — Input controller.
Handles Mouse, Keyboard, and Media keys via pyautogui.
"""

import pyautogui

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0

# --- Mouse ---
def move_mouse(dx: int, dy: int) -> bool:
    try:
        pyautogui.moveRel(dx, dy, duration=0)
        return True
    except Exception:
        return False

def click_mouse(button: str = "left") -> bool:
    if button not in ("left", "right", "middle"):
        return False
    try:
        pyautogui.click(button=button)
        return True
    except Exception:
        return False

def scroll_mouse(dy: int) -> bool:
    try:
        pyautogui.scroll(int(dy))
        return True
    except Exception:
        return False

# --- Keyboard ---
def type_text(text: str) -> bool:
    try:
        pyautogui.write(text, interval=0.01)
        return True
    except Exception:
        return False

def press_key(key: str) -> bool:
    allowed_keys = ["enter", "esc", "backspace", "tab", "space", "up", "down", "left", "right", "ctrl", "alt"]
    if key.lower() not in allowed_keys:
        return False
    try:
        pyautogui.press(key.lower())
        return True
    except Exception:
        return False

# --- Media ---
def media_control(action: str) -> bool:
    media_keys = {
        "playpause": "playpause",
        "next": "nexttrack",
        "prev": "prevtrack",
        "volup": "volumeup",
        "voldown": "volumedown",
        "mute": "volumemute",
    }
    if action not in media_keys:
        return False
    try:
        pyautogui.press(media_keys[action])
        return True
    except Exception:
        return False