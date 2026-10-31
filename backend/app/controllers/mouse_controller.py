"""
NEXUS Remote — Mouse controller.
Uses pyautogui to control the Windows cursor.
"""

import pyautogui

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0

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