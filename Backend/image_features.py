
import cv2 as cv
import numpy as np


def extract_features(img):
    img = cv.resize(img, (100, 100))
    features = []

    for channel in range(3):
        hist = cv.calcHist(
            [img],
            [channel],
            None,
            [8],
            [0, 256]
        )

        hist = cv.normalize(
            hist,
            hist,
            alpha=1,
            norm_type=cv.NORM_L1
        )

        features.extend(hist.flatten())

    return np.array(features, dtype=np.float32)
