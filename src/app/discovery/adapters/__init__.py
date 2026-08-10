from app.discovery.adapters.base import registry
from app.discovery.adapters.google_places import GooglePlacesAdapter
from app.discovery.adapters.json_api import JsonApiAdapter
from app.discovery.adapters.manual import ManualSourceAdapter
from app.discovery.adapters.overpass import OverpassAdapter

# Register automated adapters
registry.register(OverpassAdapter())
registry.register(GooglePlacesAdapter())

# Register manual sources (cannot be safely automated)
registry.register(ManualSourceAdapter("airbnb"))
registry.register(ManualSourceAdapter("olx"))
registry.register(ManualSourceAdapter("dubizzle"))
registry.register(ManualSourceAdapter("facebook"))
registry.register(ManualSourceAdapter("manual"))

__all__ = [
    "registry",
    "JsonApiAdapter",
    "ManualSourceAdapter",
    "OverpassAdapter",
    "GooglePlacesAdapter",
]
