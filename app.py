
import re

import requests
from flask import Flask, render_template, request

app = Flask(__name__)

OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/product"


def get_product_by_barcode(barcode):
    """Retrieve product information from Open Food Facts."""
    if not re.fullmatch(r"\d{8,14}", barcode):
        return None, "Enter a valid barcode containing 8–14 digits."

    url = f"{OPEN_FOOD_FACTS_URL}/{barcode}.json"
    fields = (
        "product_name,brands,ingredients_text,nutriments,"
        "allergens,allergens_tags,image_front_url"
    )

    try:
        response = requests.get(
            url,
            params={"fields": fields},
            headers={"User-Agent": "SheScanAI/1.0 (food information prototype)"},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

    except requests.RequestException:
        return None, (
            "We couldn't reach the product database. "
            "Check your internet connection or try again."
        )
    except ValueError:
        return None, "The product database returned an invalid response."

    if data.get("status") != 1 or not data.get("product"):
        return None, (
            "Product not found. Try another barcode or enter "
            "the ingredients manually."
        )

    product = data["product"]
    nutriments = product.get("nutriments") or {}

    def nutrient(key):
        value = nutriments.get(key)
        if value is None or value == "":
            return "Not available"
        return value

    allergens = product.get("allergens")
    if not allergens:
        allergens = ", ".join(product.get("allergens_tags") or [])
    if not allergens:
        allergens = "No allergen data provided"

    return {
        "name": product.get("product_name") or "Unnamed product",
        "brand": product.get("brands") or "Brand not listed",
        "ingredients": product.get("ingredients_text")
        or "Ingredients not available in the database.",
        "allergens": allergens,
        "image": product.get("image_front_url"),
        "nutrition": {
            "energy": nutrient("energy-kcal_100g"),
            "fat": nutrient("fat_100g"),
            "saturated_fat": nutrient("saturated-fat_100g"),
            "carbohydrates": nutrient("carbohydrates_100g"),
            "sugars": nutrient("sugars_100g"),
            "protein": nutrient("proteins_100g"),
            "salt": nutrient("salt_100g"),
        },
        "source": "Open Food Facts",
    }, None


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/scan", methods=["GET", "POST"])
def scan():
    if request.method == "GET":
        return render_template("scan.html")

    barcode = request.form.get("barcode", "").strip()
    ingredients = request.form.get("ingredients", "").strip()

    if barcode:
        product, error = get_product_by_barcode(barcode)

        if error:
            return render_template("scan.html", error=error), 400

        return render_template("results.html", product=product)

    if ingredients:
        product = {
            "name": "Manually entered ingredients",
            "brand": "Not specified",
            "ingredients": ingredients,
            "allergens": "Not automatically identified",
            "image": None,
            "nutrition": None,
            "source": "User-provided information",
        }
        return render_template("results.html", product=product)

    return render_template(
        "scan.html",
        error="Enter a barcode or provide an ingredient list.",
    ), 400


if __name__ == "__main__":
    app.run(debug=True)
