
import { useRef, useState } from "react";
import "./App.css";

const API_URL = "/api";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [category, setCategory] = useState("All");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultsRef = useRef(null);

  function handleFileChange(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (preview) URL.revokeObjectURL(preview);

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMatches([]);
    setError("");
  }

  async function findSimilarProducts() {
    if (!file) {
      setError("Choose an image before searching.");
      return;
    }

    setLoading(true);
    setError("");
    setMatches([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const params = new URLSearchParams({
        top_k: "5",
        category,
      });

      let response;

      try {
        response = await fetch(
          `${API_URL}/find-similar?${params.toString()}`,
          { method: "POST", body: formData }
        );
      } catch {
        throw new Error(
          "Cannot connect to the backend. Start the FastAPI server on port 8000."
        );
      }

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("The backend returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.detail || `Request failed (${response.status}).`);
      }

      setMatches(data.matches || []);

      if (!data.matches?.length) {
        setError("No matching products found. Try another category.");
        return;
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      console.error("Product search failed:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function resetSearch() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setMatches([]);
    setError("");

    const input = document.getElementById("image-upload");
    if (input) input.value = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#">
          <span className="brand-icon">V</span>
          <span>VisualFind<span className="brand-dot">.</span></span>
        </a>

        <a className="nav-link" href="#how-it-works">
          How it works <span>↗</span>
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-pill">
            <span className="live-dot" />
            VISUAL DISCOVERY, REIMAGINED
          </div>

          <h1>
            See it. Search it.
            <br />
            <span>Find your match.</span>
          </h1>

          <p>
            Have a product photo you love? Discover similar-looking
            finds from our curated collection in seconds.
          </p>

          <div className="hero-stats">
            <div><strong>01</strong><span>Upload a photo</span></div>
            <span className="stat-divider" />
            <div><strong>02</strong><span>Find visual matches</span></div>
          </div>
        </section>

        <section className="search-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR VISUAL SEARCH</span>
              <h2>What are you looking for?</h2>
            </div>
            <span className="step-badge">STEP 01</span>
          </div>

          <div className="category-control">
            <label htmlFor="category">Explore category</label>
            <select
              id="category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setMatches([]);
                setError("");
              }}
            >
              <option value="All">All products</option>
              <option value="Bags">Bags</option>
              <option value="Clothing">Clothing</option>
            </select>
          </div>

          <label
            className={`upload-area ${preview ? "has-preview" : ""}`}
            htmlFor="image-upload"
          >
            {preview ? (
              <div className="preview-wrap">
                <img src={preview} className="preview-image" alt="Selected product" />
                <span className="preview-badge">IMAGE READY</span>
                <span className="change-hint">Click to change image</span>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                  </svg>
                </div>
                <h3>Drop your inspiration here</h3>
                <p>Or click below to browse your device</p>
                <span className="file-hint">JPG · PNG · WEBP</span>
              </div>
            )}
          </label>

          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          <div className="search-actions">
            <label className="choose-button" htmlFor="image-upload">
              Choose image
            </label>

            <button
              className="search-button"
              onClick={findSimilarProducts}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Finding your matches...
                </>
              ) : (
                <>Find similar products <span>↗</span></>
              )}
            </button>
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          <p className="privacy-note">
            <span>✳</span> Your image is analyzed for visual matching.
          </p>
        </section>

        {matches.length > 0 && (
          <section className="results-section" ref={resultsRef}>
            <div className="results-topline">
              <span className="eyebrow">THE RESULTS ARE IN</span>
              <span className="result-count">{matches.length} FINDS</span>
            </div>

            <div className="results-heading">
              <div>
                <h2>Your next <span>favourite.</span></h2>
                <p>Visually similar products, picked from your collection.</p>
              </div>

              <button className="reset-button" onClick={resetSearch}>
                New search ↗
              </button>
            </div>

            <div className="product-grid">
              {matches.map((product, index) => (
                <article
                  className="product-card"
                  key={product.id}
                  style={{ "--card-index": index }}
                >
                  <div className="product-image-wrap">
                    <img
                      src={`${API_URL}${product.image_url}`}
                      alt={product.name}
                      loading="lazy"
                    />
                    <span className="match-number">
                      MATCH 0{index + 1}
                    </span>
                  </div>

                  <div className="product-info">
                    <span className="product-category">{product.category}</span>
                    <h3>{product.name}</h3>
                    <div className="product-bottom">
                      <p className="product-price">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </p>
                      <span className="distance">
                        Distance {Number(product.distance).toFixed(3)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <p className="results-note">
              Matches are ranked by color and spatial histogram similarity.
              Lower distance means a closer feature match.
            </p>
          </section>
        )}

        {!matches.length && !loading && (
          <section className="how-it-works" id="how-it-works">
            <div className="section-intro">
              <span className="eyebrow">THREE SIMPLE STEPS</span>
              <h2>A new way to <span>discover.</span></h2>
            </div>

            <div className="steps">
              <article>
                <span className="step-number">01</span>
                <div className="step-icon">↥</div>
                <h3>Bring your inspiration</h3>
                <p>Upload a product photo that catches your eye.</p>
              </article>
              <article>
                <span className="step-number">02</span>
                <div className="step-icon">⌕</div>
                <h3>Let visuals guide you</h3>
                <p>Image features are compared against your catalog.</p>
              </article>
              <article>
                <span className="step-number">03</span>
                <div className="step-icon">✳</div>
                <h3>Meet your matches</h3>
                <p>Explore the closest visual matches and their prices.</p>
              </article>
            </div>
          </section>
        )}
      </main>

      <footer>
        <a className="footer-brand" href="#">VisualFind.</a>
        <span>Find more in what you see.</span>
        <span>BUILT FOR VISUAL DISCOVERY</span>
      </footer>
    </div>
  );
}

export default App;
