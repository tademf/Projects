"""
NEXUS Remote — System monitoring service.

Reads live CPU, RAM, disk, network, battery, uptime via psutil.
Used by the WebSocket endpoint to stream stats to the phone.
"""

import platform
import socket
import time
from datetime import datetime, timezone
from typing import Any

import psutil


def get_device_info() -> dict[str, Any]:
    """Static info about the PC — hostname, OS, CPU model."""
    cpu_freq = psutil.cpu_freq()
    return {
        "hostname": socket.gethostname(),
        "os": f"{platform.system()} {platform.release()}",
        "cpu_model": platform.processor() or "Unknown",
        "cpu_cores_physical": psutil.cpu_count(logical=False),
        "cpu_cores_logical": psutil.cpu_count(logical=True),
        "cpu_freq_mhz": round(cpu_freq.max, 0) if cpu_freq else None,
        "total_ram_gb": round(psutil.virtual_memory().total / (1024 ** 3), 1),
    }


def _get_battery() -> dict[str, Any] | None:
    """Battery info — returns None on desktops without a battery."""
    try:
        battery = psutil.sensors_battery()
    except Exception:
        return None
    if battery is None:
        return None
    return {
        "percent": round(battery.percent, 1),
        "plugged": battery.power_plugged,
        "seconds_left": battery.secsleft if battery.secsleft > 0 else None,
    }


def _get_network() -> dict[str, Any]:
    """Cumulative network counters. Caller computes per-second rate."""
    io = psutil.net_io_counters()
    return {
        "bytes_sent_total": io.bytes_sent,
        "bytes_recv_total": io.bytes_recv,
    }


def get_system_stats() -> dict[str, Any]:
    """
    Snapshot of all live metrics.

    Called once per second by the WebSocket streamer.
    Kept lightweight — no heavy syscalls, no disk scanning.
    """
    vm = psutil.virtual_memory()
    disk = (
        psutil.disk_usage("C:\\")
        if platform.system() == "Windows"
        else psutil.disk_usage("/")
    )

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cpu": {
            "percent": psutil.cpu_percent(interval=None),
            "cores_logical": psutil.cpu_count(logical=True),
        },
        "ram": {
            "percent": vm.percent,
            "used_gb": round(vm.used / (1024 ** 3), 2),
            "total_gb": round(vm.total / (1024 ** 3), 2),
            "available_gb": round(vm.available / (1024 ** 3), 2),
        },
        "disk": {
            "percent": disk.percent,
            "used_gb": round(disk.used / (1024 ** 3), 2),
            "total_gb": round(disk.total / (1024 ** 3), 2),
            "free_gb": round(disk.free / (1024 ** 3), 2),
        },
        "network": _get_network(),
        "battery": _get_battery(),
        "uptime_seconds": int(time.time() - psutil.boot_time()),
    }


def format_uptime(seconds: int) -> str:
    """Format seconds → '2d 3h 14m' style."""
    days, rem = divmod(seconds, 86400)
    hours, rem = divmod(rem, 3600)
    minutes, _ = divmod(rem, 60)
    parts = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    parts.append(f"{minutes}m")
    return " ".join(parts)