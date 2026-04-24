import { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  function renderTree(node, prefix = "") {
    const entries = Object.entries(node);

    return entries.map(([key, value], index) => {
      const isLast = index === entries.length - 1;

      return (
        <div key={key}>
          <div style={{ fontFamily: "monospace" }}>
            {prefix}
            {isLast ? "└── " : "├── "}
            <span style={{ color: "#7c3aed", fontWeight: "bold" }}>
              {key}
            </span>
          </div>

          {Object.keys(value).length > 0 && (
            <div>
              {renderTree(
                value,
                prefix + (isLast ? "    " : "│   ")
              )}
            </div>
          )}
        </div>
      );
    });
  }

  const sendData = async () => {
    setLoading(true);

    try {
      const data = input.split(",").map(x => x.trim());

      const res = await fetch("http://localhost:3000/bfhl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) throw new Error("API error");

      const json = await res.json();
      setOutput(json);
    } catch (err) {
      alert("Error: Unable to reach backend");
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e1e2f, #121212)",
      color: "white",
      padding: "30px",
      fontFamily: "Arial"
    }}>
      
      <h1 style={{ textAlign: "center", fontSize: "32px", marginBottom: "20px" }}>
        BFHL Tree Builder
      </h1>

      <div style={{
        maxWidth: "600px",
        margin: "auto",
        background: "#222",
        padding: "20px",
        borderRadius: "10px"
      }}>
        <textarea
          rows="4"
          style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
          placeholder="A->B, A->C, B->D"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          onClick={sendData}
          disabled={loading}
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "10px",
            background: "#7c3aed",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Processing..." : "Generate"}
        </button>
      </div>

      {output && (
        <div style={{
          maxWidth: "800px",
          margin: "30px auto",
          background: "#111",
          padding: "20px",
          borderRadius: "10px"
        }}>
          <h2>Summary</h2>

          <p>Trees: {output.summary.total_trees}</p>
          <p>Cycles: {output.summary.total_cycles}</p>
          <p>Largest Root: {output.summary.largest_tree_root || "-"}</p>

          <h3>Input</h3>
          <pre style={{ background: "#000", padding: "10px" }}>
            {input}
          </pre>

          <h3>Raw Response (JSON)</h3>
          <pre style={{
            background: "#000",
            padding: "10px",
            color: "#00ff9f",
            overflowX: "auto"
          }}>
            {JSON.stringify(output, null, 2)}
          </pre>

          {output.invalid_entries.length > 0 && (
            <p style={{ color: "red" }}>
              Invalid Entries: {output.invalid_entries.join(", ")}
            </p>
          )}

          {output.duplicate_edges.length > 0 && (
            <p style={{ color: "yellow" }}>
              Duplicate Edges: {output.duplicate_edges.join(", ")}
            </p>
          )}

          <div style={{ marginTop: "20px" }}>
            <h3>Hierarchies</h3>

            {output.hierarchies.map((h, i) => (
              <div key={i} style={{
                background: "#1a1a1a",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "15px"
              }}>
                <p><strong>Root:</strong> {h.root}</p>

                {h.has_cycle ? (
                  <p style={{ color: "red" }}>Cycle detected</p>
                ) : (
                  <>
                    <p><strong>Depth:</strong> {h.depth}</p>

                    <div style={{ marginTop: "10px", fontFamily: "monospace" }}>
                      {Object.entries(h.tree).map(([root, children]) => (
                        <div key={root}>
                          <div>
                            <span style={{ color: "#7c3aed", fontWeight: "bold" }}>
                              {root}
                            </span>
                          </div>
                          {renderTree(children)}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}