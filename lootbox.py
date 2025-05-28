import requests
import random
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
from io import BytesIO

# API URLs
WEAPONS_URL = "https://valorant-api.com/v1/weapons"
TIERS_URL = "https://valorant-api.com/v1/contenttiers"

# Drop rates
RARITY_PROBABILITIES = {
    "common": 0.7992,
    "rare": 0.1598,
    "epic": 0.032,
    "ultra": 0.0064,
    "exclusive": 0.0026
}

RARITY_COLORS = {
    "common": "gray",
    "rare": "blue",
    "epic": "purple",
    "ultra": "orange",
    "exclusive": "gold"
}

def fetch_api_data():
    weapons = requests.get(WEAPONS_URL).json()["data"]
    tiers = requests.get(TIERS_URL).json()["data"]
    return weapons, tiers

def map_tiers_by_id(tiers):
    return {tier["uuid"]: tier for tier in tiers}

def categorize_rarity(tiers_by_id):
    rarity_map = {}
    for tier_id, tier in tiers_by_id.items():
        name = tier.get("displayName", "").lower()
        if "select" in name or "standard" in name:
            rarity_map[tier_id] = "common"
        elif "deluxe" in name:
            rarity_map[tier_id] = "rare"
        elif "premium" in name:
            rarity_map[tier_id] = "epic"
        elif "ultra" in name:
            rarity_map[tier_id] = "ultra"
        elif "exclusive" in name:
            rarity_map[tier_id] = "exclusive"
    return rarity_map

def build_skin_pool(weapons, rarity_map):
    pool = {r: [] for r in RARITY_PROBABILITIES}
    for weapon in weapons:
        for skin in weapon["skins"]:
            tier_id = skin.get("contentTierUuid")
            if not tier_id:
                continue
            rarity = rarity_map.get(tier_id)
            if rarity:
                pool[rarity].append({
                    "name": skin["displayName"],
                    "weapon": weapon["displayName"],
                    "rarity": rarity,
                    "icon": skin.get("displayIcon")
                })
    return pool

def weighted_random_choice(choices):
    total = sum(choices.values())
    r = random.uniform(0, total)
    upto = 0
    for key, weight in choices.items():
        if upto + weight >= r:
            return key
        upto += weight
    return key

def open_lootbox(skin_pool):
    rarity = weighted_random_choice(RARITY_PROBABILITIES)
    if not skin_pool[rarity]:
        return None
    return random.choice(skin_pool[rarity])

# ==== UI Setup ====

class LootboxApp:
    def __init__(self, root, skin_pool):
        self.root = root
        self.skin_pool = skin_pool
        self.root.title("Valorant Lootbox Simulator")

        self.label = ttk.Label(root, text="Open a lootbox!", font=("Arial", 18))
        self.label.pack(pady=10)

        self.image_label = tk.Label(root)
        self.image_label.pack()

        self.result_label = tk.Label(root, font=("Arial", 16))
        self.result_label.pack(pady=10)

        self.button = ttk.Button(root, text="Open Lootbox", command=self.open_box)
        self.button.pack(pady=20)

    def open_box(self):
        drop = open_lootbox(self.skin_pool)
        if drop:
            name = f"{drop['name']} ({drop['weapon']})"
            rarity = drop['rarity']
            color = RARITY_COLORS.get(rarity, "black")

            # Load and show image
            img_url = drop["icon"]
            if img_url:
                img_data = requests.get(img_url).content
                img = Image.open(BytesIO(img_data))
                self.photo = ImageTk.PhotoImage(img)
                self.image_label.configure(image=self.photo)
            else:
                self.image_label.configure(image="")

            self.result_label.config(
                text=f"{name}\nRarity: {rarity.capitalize()}",
                fg=color
            )

# ==== Run ====

if __name__ == "__main__":
    print("Fetching data...")
    weapons, tiers = fetch_api_data()
    tiers_by_id = map_tiers_by_id(tiers)
    rarity_map = categorize_rarity(tiers_by_id)
    skin_pool = build_skin_pool(weapons, rarity_map)

    print("Starting UI...")
    root = tk.Tk()
    app = LootboxApp(root, skin_pool)
    root.mainloop()
