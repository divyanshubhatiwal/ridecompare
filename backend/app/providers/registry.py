"""
Provider registry — single place to add/remove provider adapters.
"""
from typing import List
from app.providers.base import BaseRideProvider
from app.providers.uber import UberProvider
from app.providers.ola import OlaProvider
from app.providers.rapido import RapidoProvider
from app.providers.indrive import InDriveProvider


_PROVIDER_INSTANCES: List[BaseRideProvider] = [
    UberProvider(),
    OlaProvider(),
    RapidoProvider(),
    InDriveProvider(),
]


def get_all_providers() -> List[BaseRideProvider]:
    return _PROVIDER_INSTANCES


def get_provider_by_name(name: str) -> BaseRideProvider:
    for p in _PROVIDER_INSTANCES:
        if p.provider_name == name:
            return p
    raise ValueError(f"Unknown provider: {name}")
