
import csv
from pathlib import Path

import cv2 as cv
import numpy as np

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sklearn.neighbors import NearestNeighbors

from image_features import extract_features


BASE_DIR = Path(__file__).resolve().parent
IMAGE_DIR = BASE_DIR / "images"
CSV_PATH = BASE_DIR / "products.csv"

app = FastAPI(title="Visual Product Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMAGE_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/images",
    StaticFiles(directory=str(IMAGE_DIR)),
    name="images"
)


def load_products():
    loaded_products = []

    with open(CSV_PATH, "r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        required_columns = {"id", "name", "category", "price", "image"}

        if not reader.fieldnames or not required_columns.issubset(reader.fieldnames):
            raise ValueError(
                "products.csv must contain id, name, category, price, image"
            )

        for row in reader:
            image_name = row["image"].strip()

            if not image_name or Path(image_name).name != image_name:
                raise ValueError(f"Invalid image filename: {image_name}")

            image_path = IMAGE_DIR / image_name
            img = cv.imread(str(image_path))

            if img is None:
                raise ValueError(f"Could not load catalog image: {image_path}")

            loaded_products.append({
                "id": row["id"],
                "name": row["name"],
                "category": row["category"],
                "price": float(row["price"]),
                "image": image_name,
                "features": extract_features(img)
            })

    if not loaded_products:
        raise ValueError("Add at least one product to products.csv")

    return loaded_products


products = load_products()

X = np.array(
    [product["features"] for product in products],
    dtype=np.float32
)

model = NearestNeighbors(
    metric="euclidean",
    algorithm="brute"
)

model.fit(X)


def format_product(product, distance=None):
    result = {
        "id": product["id"],
        "name": product["name"],
        "category": product["category"],
        "price": product["price"],
        "image_url": f"/images/{product['image']}"
    }

    if distance is not None:
        result["distance"] = round(float(distance), 4)

    return result


@app.get("/")
def home():
    return {
        "message": "Visual Product Finder API is running",
        "products_loaded": len(products)
    }


@app.get("/products")
def get_products():
    return {
        "products": [
            format_product(product) for product in products
        ]
    }


@app.post("/find-similar")
async def find_similar(
    file: UploadFile = File(...),
    top_k: int = Query(default=5, ge=1, le=20)
):
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file."
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    query_image = cv.imdecode(image_array, cv.IMREAD_COLOR)

    if query_image is None:
        raise HTTPException(
            status_code=400,
            detail="Could not decode the uploaded image."
        )

    query_features = extract_features(query_image).reshape(1, -1)
    count = min(top_k, len(products))

    distances, indices = model.kneighbors(
        query_features,
        n_neighbors=count
    )

    matches = [
        format_product(products[int(index)], distance)
        for index, distance in zip(indices[0], distances[0])
    ]

    return {
        "query_filename": file.filename,
        "matches": matches,
        "distance_note": "Lower distance indicates closer color histogram features."
    }
