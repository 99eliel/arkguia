#!/usr/bin/env python3
import json
import re
import time
import urllib.request
from pathlib import Path

SOURCE = "https://raw.githubusercontent.com/ArkAscendedAI/sheldon-ai-for-ark/main/data/vanilla/items.json"
ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "crafting-catalog.json"
OUT_JS = ROOT / "crafting-data.js"

# Mantém os IDs da primeira versão para não perder planejamentos já salvos.
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

PT_INGREDIENTS = {
    "Hide": "Couro", "Hide_C": "Couro",
    "Fibers": "Fibra", "Fibers_C": "Fibra", "Fiber": "Fibra",
    "Wood": "Madeira", "Wood_C": "Madeira",
    "Stone": "Pedra", "Stone_C": "Pedra",
    "Thatch": "Palha", "Thatch_C": "Palha",
    "Flint": "Sílex", "Flint_C": "Sílex",
    "Metal": "Metal", "Metal_C": "Metal",
    "MetalIngot": "Metal Fundido", "MetalIngot_C": "Metal Fundido",
    "Crystal": "Cristal", "Crystal_C": "Cristal",
    "Oil": "Óleo", "Oil_C": "Óleo",
    "Obsidian": "Obsidiana", "Obsidian_C": "Obsidiana",
    "Silicon": "Pérola de Sílica", "Silicon_C": "Pérola de Sílica",
    "SilicaPearls": "Pérola de Sílica", "SilicaPearls_C": "Pérola de Sílica",
    "Chitin": "Quitina", "Chitin_C": "Quitina",
    "Keratin": "Queratina", "Keratin_C": "Queratina",
    "ChitinOrKeratin": "Quitina / Queratina", "ChitinOrKeratin_C": "Quitina / Queratina",
    "ChitinPaste": "Pasta de Cimento", "ChitinPaste_C": "Pasta de Cimento",
    "CementingPaste": "Pasta de Cimento", "CementingPaste_C": "Pasta de Cimento",
    "Polymer": "Polímero", "Polymer_C": "Polímero",
    "OrganicPolymer": "Polímero Orgânico", "OrganicPolymer_C": "Polímero Orgânico",
    "Electronics": "Eletrônicos", "Electronics_C": "Eletrônicos",
    "Sparkpowder": "Pólvora Faiscante", "Sparkpowder_C": "Pólvora Faiscante",
    "Gunpowder": "Pólvora", "Gunpowder_C": "Pólvora",
    "Charcoal": "Carvão", "Charcoal_C": "Carvão",
    "Narcotic": "Narcótico", "Narcotic_C": "Narcótico",
    "Stimulant": "Estimulante", "Stimulant_C": "Estimulante",
    "Narcoberry": "Narcoberry", "Narcoberry_C": "Narcoberry",
    "Stimberry": "Stimberry", "Stimberry_C": "Stimberry",
    "SpoiledMeat": "Carne Podre", "SpoiledMeat_C": "Carne Podre",
    "RawMeat": "Carne Crua", "RawMeat_C": "Carne Crua",
    "RawPrimeMeat": "Carne Nobre Crua", "RawPrimeMeat_C": "Carne Nobre Crua",
    "Pelt": "Pelo", "Pelt_C": "Pelo",
    "Wool": "Lã", "Wool_C": "Lã",
    "Element": "Elemento", "Element_C": "Elemento",
    "ElementShard": "Fragmento de Elemento", "ElementShard_C": "Fragmento de Elemento",
    "BlackPearl": "Pérola Negra", "BlackPearl_C": "Pérola Negra",
    "BlackPearls": "Pérola Negra", "BlackPearls_C": "Pérola Negra",
    "Sap": "Seiva", "Sap_C": "Seiva",
    "CactusSap": "Seiva de Cacto", "CactusSap_C": "Seiva de Cacto",
    "Sand": "Areia", "Sand_C": "Areia",
    "Clay": "Argila", "Clay_C": "Argila",
    "Sulfur": "Enxofre", "Sulfur_C": "Enxofre",
    "Propellant": "Propelente", "Propellant_C": "Propelente",
    "Gasoline": "Gasolina", "Gasoline_C": "Gasolina",
    "CongealedGasBall": "Bola de Gás Congelado", "CongealedGasBall_C": "Bola de Gás Congelado",
    "GreenGem": "Gema Verde", "GreenGem_C": "Gema Verde",
    "BlueGem": "Gema Azul", "BlueGem_C": "Gema Azul",
    "RedGem": "Gema Vermelha", "RedGem_C": "Gema Vermelha",
    "FungalWood": "Madeira Fúngica", "FungalWood_C": "Madeira Fúngica",
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
    "Smithy": "Inventário",
    "Mortar and Pestle": "Inventário",
    "Refining Forge": "Inventário",
    "Chemistry Bench": "Fabricador",
    "Industrial Forge": "Fabricador",
    "Industrial Grill": "Fabricador",
    "Industrial Cooker": "Fabricador",
    "Industrial Grinder": "Fabricador",
    "Tek Replicator": "Obelisco / terminal apropriado",
}

PREFIXES = (
    "PrimalItemResource_", "PrimalItemConsumable_", "PrimalItemStructure_",
    "PrimalItemArmor_", "PrimalItemAmmo_", "PrimalItemWeaponAttachment_",
    "PrimalItem_Weapon", "PrimalItem_", "PrimalItem",
)


def fetch_source():
    req = urllib.request.Request(SOURCE, headers={
        "Accept": "application/json",
        "User-Agent": "ArkGuia/1.0 (+https://github.com/99eliel/arkguia)",
    })
    with urllib.request.urlopen(req, timeout=90) as response:
        return json.load(response)


def class_name(blueprint):
    if not blueprint:
        return ""
    return blueprint.rsplit(".", 1)[-1]


def aliases_for_class(cls):
    values = {cls}
    raw = cls[:-2] if cls.endswith("_C") else cls
    values.add(raw)
    for prefix in PREFIXES:
        if raw.startswith(prefix):
            stripped = raw[len(prefix):]
            values.add(stripped)
            values.add(stripped + "_C")
    return {v for v in values if v}


def pretty_internal(code):
    raw = code[:-2] if code.endswith("_C") else code
    for prefix in PREFIXES:
        if raw.startswith(prefix):
            raw = raw[len(prefix):]
            break
    raw = raw.replace("_", " ")
    raw = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", raw)
    return raw.strip() or code


def category(item):
    typ = (item.get("type") or "").lower()
    name = (item.get("name") or "").lower()
    blueprint = (item.get("blueprint") or "").lower()
    if "dinosaddle" in typ or "saddle" in name or "/saddles/" in blueprint:
        return "Sela"
    if typ == "ammo" or "ammo" in typ:
        return "Munição"
    if "weaponattachment" in typ:
        return "Acessório"
    if "weapon" in typ or "/weapons/" in blueprint:
        return "Arma / Ferramenta"
    if "armor" in typ and "saddle" not in typ:
        return "Armadura"
    if "structure" in typ or "/structures/" in blueprint:
        return "Estrutura"
    if "resource" in typ or "/resources/" in blueprint:
        return "Recurso"
    if "consumable" in typ or "food" in typ:
        return "Consumível"
    if "skin" in typ or "costume" in typ or "emote" in name or "hair style" in name:
        return "Cosmético"
    if "tek" in name:
        return "Tek"
    return "Outros"


def stable_id(item):
    name = (item.get("name") or "").strip()
    if name in LEGACY_IDS:
        return LEGACY_IDS[name]
    cls = class_name(item.get("blueprint")) or name
    slug = re.sub(r"[^a-z0-9]+", "-", cls.lower()).strip("-")
    return "ark-" + slug


def station(item):
    name = (item.get("name") or "").strip()
    if name in STATION_OVERRIDES:
        return STATION_OVERRIDES[name]
    cat = category(item)
    if cat == "Tek" or name.startswith("Tek "):
        return "Tek Replicator / estação indicada no engrama"
    return "Estação indicada no engrama / blueprint"


def translate_ingredient(code, alias_map):
    if code in PT_INGREDIENTS:
        return PT_INGREDIENTS[code]
    resolved = alias_map.get(code)
    if resolved:
        original = (resolved.get("name") or "").strip()
        return PT_INGREDIENTS.get(original, original or pretty_internal(code))
    pretty = pretty_internal(code)
    return PT_INGREDIENTS.get(pretty, pretty)


def main():
    source = fetch_source()
    items = source.get("items") or []

    alias_map = {}
    for item in items:
        cls = class_name(item.get("blueprint"))
        for alias in aliases_for_class(cls):
            alias_map.setdefault(alias, item)

    recipes = []
    seen = set()
    for item in items:
        crafting = item.get("crafting")
        raw_recipe = crafting.get("recipe") if isinstance(crafting, dict) else None
        if not isinstance(raw_recipe, list):
            continue

        ingredients = []
        for ing in raw_recipe:
            try:
                qty = float(ing.get("qty", 0))
            except (TypeError, ValueError):
                qty = 0
            if qty <= 0:
                continue
            if qty.is_integer():
                qty = int(qty)
            code = str(ing.get("item") or "").strip()
            if not code:
                continue
            ingredients.append([translate_ingredient(code, alias_map), qty])

        if not ingredients:
            continue

        name = (item.get("name") or class_name(item.get("blueprint")) or "Item").strip()
        # Evita itens duplicados de missões/gauntlets com exatamente a mesma receita.
        signature = (name.casefold(), tuple((x[0].casefold(), x[1]) for x in ingredients), category(item))
        if signature in seen:
            continue
        seen.add(signature)

        recipes.append({
            "id": stable_id(item),
            "nome": name,
            "original": name,
            "categoria": category(item),
            "estacao": station(item),
            "nivel": crafting.get("levelReq") if isinstance(crafting, dict) else None,
            "xp": crafting.get("xp") if isinstance(crafting, dict) else None,
            "tipo": item.get("type") or "",
            "blueprint": item.get("blueprint") or "",
            "ingredientes": ingredients,
        })

    recipes.sort(key=lambda r: (r["categoria"].casefold(), r["nome"].casefold(), r["id"]))
    meta = {
        "schema": 2,
        "source": "ArkAscendedAI/sheldon-ai-for-ark (arkutils/Obelisk)",
        "sourceGame": source.get("game"),
        "sourceVersion": source.get("version"),
        "generatedAt": int(time.time()),
        "totalSourceItems": len(items),
        "totalCraftableRecipes": len(recipes),
    }
    payload = {**meta, "recipes": recipes}
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    js = "(function(){'use strict';\nwindow.ARK_CRAFTING_META=" + json.dumps(meta, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.ARK_CRAFTING_RECIPES=" + json.dumps(recipes, ensure_ascii=False, separators=(",", ":")) + ";\n})();\n"
    OUT_JS.write_text(js, encoding="utf-8")
    print(f"Wrote {len(recipes)} craftable ASA recipes from {len(items)} source items")


if __name__ == "__main__":
    main()
