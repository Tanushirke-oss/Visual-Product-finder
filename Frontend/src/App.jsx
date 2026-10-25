
import { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [category, setCategory] = useState("All");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(event) {
    const selected = event.target.files?.[0];

    if (!selected) return;

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMatches([]);
    setError("");
  }

  async function findSimilarProducts() {
    if (!file) {
      setError("Please select an image first.");
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
        category: category
      });

      const response = await fetch(
        `${API_URL}/find-similar?${params.toString()}`,
        {
          method: "POST",
          body: formData
        }
      );

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Unexpected server response: ${responseText.slice(0, 200)}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.detail || `Request failed with status ${response.status}`
        );
      }

      setMatches(data.matches || []);

      if (!data.matches || data.matches.length === 0) {
        setError("No matching products found. Try another image or category.");
      }
    } catch (err) {
      console.error("Product search failed:", err);
      setError(
        err.message ||
        "Could not connect to the backend. Make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="/">
          <span className="brand-icon">V</span>
          <span>VisualFind</span>
        </a>
        <span className="nav-label">AI-powered visual search</span>
      </header>

      <main>
        <section className="hero">
          <span className="eyebrow">DISCOVER BY IMAGE</span>
          <h1>
            Find products that <span>look alike.</span>
          </h1>
          <p>
            Upload a photo of a T-shirt or bag and discover visually
            similar products from our collection.
          </p>
        </section>

        <section className="search-panel">
          <div className="category-control">
            <label htmlFor="category">Product category</label>
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

          <label className="upload-area" htmlFor="image-upload">
            {preview ? (
              <img
                className="preview-image"
                src={preview}
                alt="Selected product"
              />
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">↑</div>
                <h2>Upload your image</h2>
                <p>Choose a photo from your device</p>
                <span className="file-hint">JPG, PNG or WEBP</span>
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
              {loading ? "Finding matches..." : "Find similar products →"}
            </button>
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
        </section>

        {matches.length > 0 && (
          <section className="results-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">YOUR RESULTS</span>
                <h2>Similar products</h2>
              </div>
              <span className="result-count">
                {matches.length} matches
              </span>
            </div>

            <div className="product-grid">
              {matches.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <img
                      src={`${API_URL}${product.image_url}`}
                      alt={product.name}
                    />
                  </div>

                  <div className="product-info">
                    <span className="product-category">
                      {product.category}
                    </span>
                    <h3>{product.name}</h3>
                    <p className="product-price">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </p>
                    <p className="distance">
                      Color distance: {product.distance}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {matches.length === 0 && !loading && (
          <section className="how-it-works">
            <h2>How it works</h2>
            <div className="steps">
              <div>
                <span>01</span>
                <h3>Upload</h3>
                <p>Choose a product image.</p>
              </div>
              <div>
                <span>02</span>
                <h3>Analyze</h3>
                <p>Extract image color features.</p>
              </div>
              <div>
                <span>03</span>
                <h3>Discover</h3>
                <p>See the closest catalog matches.</p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer>VisualFind · Your image, your inspiration.</footer>
    </div>
  );
}

export default App;
