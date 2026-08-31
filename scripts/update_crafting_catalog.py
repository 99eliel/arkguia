#!/usr/bin/env python3
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.usebeacon.app/v4/arksa/engrams"
OFFICIAL_MARKETPLACE_ID = "2399830"
PAGE_SIZE = 250
OUT = Path(__file__).resolve().parents[1] / "crafting-catalog.json"

LEGACY_IDS = {
    "Rex Saddle": "sela-rex",
    "Argentavis Saddle": "sela-argentavis",
    "Ankylo Saddle": "sela-anquilo",
    "Pteranodon Saddle": "sela-pteranodonte",
    "Therizinosaurus Saddle": "sela-therizino",
    "Crossbow": "besta",
    "Longneck Rifle": "rifle-cano-longo",
    "Assault Rifle": "rifle-assalto",
}

STATION_OVERRIDES = {
    "Rex Saddle": "Ferraria / sela de Argentavis",
    "Argentavis Saddle": "Inventário",
    "Ankylo Saddle": "Ferraria / sela de Argentavis",
    "Pteranodon Saddle": "Inventário",
    "Therizinosaurus Saddle": "Ferraria / sela de Argentavis",
    "Crossbow": "Ferraria / sela de Argentavis",
    "Longneck Rifle": "Ferraria / sela de Argentavis",
    "Assault Rifle": "Fabricador",
    "Fabricator": "Ferraria / sela de Argentavis",
    "Chemistry Bench": "Fabricador",
    "Industrial Forge": "Fabricador",
    "Industrial Grill": "Fabricador",
    "Industrial Cooker": "Fabricador",
    "Industrial Grinder": "Fabricador",
    "Tek Replicator": "Obelisco / terminal apropriado",
}


def get_json(params):
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "ArkGuia/1.0 (+https://github.com/99eliel/arkguia)",
    })
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.load(response)


def fetch_all():
    base = {
        "contentPackMarketplaceId": OFFICIAL_MARKETPLACE_ID,
        "pageSize": PAGE_SIZE,
        "page": 1,
    }
    first = get_json(base)
    results = list(first.get("results") or [])
    pages = int(first.get("pages") or 1)
    for page in range(2, pages + 1):
        params = dict(base)
        params["page"] = page
        payload = get_json(params)
        results.extend(payload.get("results") or [])
        time.sleep(0.08)
    return results


def obj_id(item):
    return item.get("engramId") or item.get("objectId") or item.get("blueprintId")


def category(item):
    label = (item.get("label") or "").lower()
    path = (item.get("path") or "").lower()
    cls = (item.get("classString") or "").lower()
    tags = {str(t).lower() for t in (item.get("tags") or [])}

    if "saddle" in label or "/saddles/" in path:
        return "Sela"
    if cls.startswith("primalitemammo_") or " ammo" in label or label.endswith(" arrow") or label.endswith(" bullet") or "rocket propelled grenade" in label:
        return "Munição"
    if "/weapons/" in path or cls.startswith("primalitem_weapon") or any(x in label for x in ["rifle", "pistol", "shotgun", "sword", "spear", "bow", "crossbow", "club", "launcher", "flamethrower", "whip", "boomerang", "chainsaw"]):
        return "Arma / Ferramenta"
    if "/armor/" in path or cls.startswith("primalitemarmor_"):
        return "Armadura"
    if cls.startswith("primalitemstructure_") or "/structures/" in path:
        return "Estrutura"
    if "/resources/" in path or cls.startswith("primalitemresource_"):
        return "Recurso"
    if cls.startswith("primalitemconsumable_") or any(x in label for x in ["kibble", "brew", "stew", "chowder", "curry", "soup", "cake", "tonic", "antidote", "dye", "coloring"]):
        return "Consumível"
    if "tek" in tags or label.startswith("tek "):
        return "Tek"
    return "Outros"


def station(item):
    label = item.get("label") or ""
    if label in STATION_OVERRIDES:
        return STATION_OVERRIDES[label]
    tags = {str(t).lower() for t in (item.get("tags") or [])}
    if "tek" in tags or label.startswith("Tek "):
        return "Tek Replicator"
    cls = item.get("classString") or ""
    if cls.startswith("PrimalItemAmmo_") and any(x in label for x in ["Advanced", "Rocket", "Grenade", "Cannon", "Tranq Spear Bolt"]):
        return "Fabricador"
    return "Conforme o engrama / blueprint no jogo"


def stable_id(item):
    label = item.get("label") or ""
    if label in LEGACY_IDS:
        return LEGACY_IDS[label]
    oid = obj_id(item)
    if oid:
        return "ark-" + str(oid).lower()
    cls = item.get("classString") or label
    slug = re.sub(r"[^a-z0-9]+", "-", cls.lower()).strip("-")
    return "ark-" + slug


def number(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return 0
    return int(f) if f.is_integer() else f


def main():
    all_items = fetch_all()
    by_id = {obj_id(x): x for x in all_items if obj_id(x)}
    recipes = []

    for item in all_items:
        raw_recipe = item.get("recipe")
        if not isinstance(raw_recipe, list) or not raw_recipe:
            continue
        ingredients = []
        for ing in raw_recipe:
            iid = ing.get("engramId")
            source = by_id.get(iid, {})
            name = source.get("label") or ing.get("label") or f"Ingrediente {str(iid)[:8]}"
            qty = number(ing.get("quantity"))
            if qty <= 0:
                continue
            ingredients.append({
                "name": name,
                "quantity": qty,
                "exact": bool(ing.get("exact", False)),
            })
        if not ingredients:
            continue
        recipes.append({
            "id": stable_id(item),
            "nome": item.get("label") or item.get("classString") or "Item",
            "original": item.get("label") or "",
            "categoria": category(item),
            "estacao": station(item),
            "nivel": item.get("requiredLevel"),
            "pontos": item.get("requiredPoints"),
            "classString": item.get("classString"),
            "path": item.get("path"),
            "tags": item.get("tags") or [],
            "availability": item.get("availability"),
            "ingredientes": ingredients,
        })

    recipes.sort(key=lambda r: ((r.get("categoria") or ""), (r.get("nome") or "").casefold()))
    payload = {
        "schema": 1,
        "source": "Beacon Ark: Survival Ascended / Ark Official",
        "marketplaceId": OFFICIAL_MARKETPLACE_ID,
        "generatedAt": int(time.time()),
        "totalOfficialEngrams": len(all_items),
        "totalCraftableRecipes": len(recipes),
        "recipes": recipes,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(recipes)} craftable recipes from {len(all_items)} official engrams to {OUT}")


if __name__ == "__main__":
    main()
