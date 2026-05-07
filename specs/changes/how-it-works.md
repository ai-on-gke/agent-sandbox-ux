I want to replace the "How it works" section at the end of the prism home experience.  I want to produce a compelling visual with supporting copy that builds off the text below and the attached image. 

I want to highlight each of the 5 steps in this new diagram.

Here is the text to use as copy and insipiration for an updated visual. This creates a clear, logical pipeline that perfectly maps to the technical pillars in your PRD.

### The Updated 5-Step Lifecycle Copy

**Section Header**
*   **Headline:** How it works: The Full Benchmark Lifecycle
*   **Subtitle:** Designed for human insight and agent automation. Standardizing the end-to-end lifecycle from routing optimization to high-fidelity reproduction.

**Step 1: Standardized Workloads** *(The "What")*
*   **Headline:** 1. Common Workload Catalog
*   **Body:** Eliminate fragmented testing scenarios. Developers and agents select standardized, reproducible workloads from our open catalog, ensuring everyone is evaluating performance against the exact same real-world conditions.

**Step 2: Automated Execution** *(The "How")*
*   **Headline:** 2. Common Tooling (`inference-perf`)
*   **Body:** Execute workloads seamlessly using community-standard tooling like `inference-perf`. Our infrastructure is built so that both human engineers and autonomous agents can trigger and run benchmarks without friction.

**Step 3: Interoperable Storage** *(The "Format")*
*   **Headline:** 3. Standardized Format & OSS Store
*   **Body:** Results are automatically mapped to a unified JSON schema and submitted to a scalable OSS results store. This guarantees direct data interoperability across all tools in the llm-d community.

**Step 4: Automated Analysis** *(The "Insights")*
*   **Headline:** 4. Dynamic Analysis via Prism
*   **Body:** Prism acts as the common analysis framework. It dynamically accesses the Results Store to visualize, align, and compare metrics across different benchmarking tools and historical baselines.

**Step 5: Reproduce & Validate** *(The "Proof")*
*   **Headline:** 5. High-Fidelity Reproduction
*   **Body:** Close the loop. Customers and agents can seamlessly reproduce exact benchmark results to validate challenger optimizations. Export Helm upgrade definitions with a single click.


# Iterations

## 1
Let's make the following changes 
- Remove the term "Central Hub"
- Remove the green arc/circle shape
- Remove the cloud storage icon in llm-d results store
- Replace Analysis (Prism) with just Prism
- Remove the Step # text in or close to the boxes. Add a separate visualization that shows each of those steps as distinct boxes in a horizontal row with arrows between them
- For each role, remove the icon and subtext (e.g. Designs full stack optimizations). Focus on the tasks and leverage the material in the Who is it for? section just above (ok to duplicate as I may remove it)
- Add a box above Standard Benchmark Format titled "Real World Workload Catalog" that includes a link to https://github.com/kubernetes-sigs/inference-perf/tree/main/workload-catalog.
- The Standard Benchmark Report should include a link to https://github.com/llm-d/llm-d-benchmark/blob/main/benchmark_report