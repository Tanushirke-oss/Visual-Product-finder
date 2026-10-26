
import cv2 as cv
import numpy as np


def extract_features(img):
    if img is None or img.size == 0:
        raise ValueError("Invalid image provided.")

    img = cv.resize(img, (128, 128), interpolation=cv.INTER_AREA)
    hsv = cv.cvtColor(img, cv.COLOR_BGR2HSV)

    features = []

    regions = [
        hsv[0:64, 0:64],
        hsv[0:64, 64:128],
        hsv[64:128, 0:64],
        hsv[64:128, 64:128],
        hsv
    ]

    for region in regions:
        hist = cv.calcHist(
            [region],
            [0, 1],
            None,
            [8, 8],
            [0, 180, 0, 256]
        )

        hist = cv.normalize(hist, hist, alpha=1, norm_type=cv.NORM_L1)
        features.extend(hist.flatten())

    return np.array(features, dtype=np.float32)
