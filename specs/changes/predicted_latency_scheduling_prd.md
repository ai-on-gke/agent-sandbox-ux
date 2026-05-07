# PRD: Predicted Latency Scheduling Benchmarks

## 1. Executive Summary

As LLM workloads become more dynamic and bursty, traditional heuristic-based load balancing strategies (e.g., scoring based on KV cache utilization and queue depth) struggle to maintain optimal performance. A new approach, **Predicted-Latency Based Scheduling**, uses a fast machine learning model (XGBoost) to predict Time to First Token (TTFT) and Time Per Output Token (TPOT) for each request on a per-server basis, enabling more intelligent request routing to meet SLOs.

This document outlines the requirements for Prism to support the discovery, detailed analysis, and comparison of benchmarks evaluating predicted-latency scheduling strategies against heuristic and default load balancing baselines.

## 2. Technical Context & Concepts

### 2.1. Routing Strategies (Scorers)

Prism must support the identification and filtering of different Gateway Endpoint Picker (EPP) routing algorithms:
- **Predicted Latency Scorer:** Uses an ML model to accurately estimate request latency and routing headroom (predicted vs. target SLO).
- **Load+Prefix Scorer:** A common heuristic-based approach combining pod load metrics (KV cache % and queued requests) with prefix cache awareness. Relies on manually tuned weights (e.g., 1, 1, 1 for prefix, queue, and kv cache).
- **Default Load Balancer:** Standard Kubernetes round-robin or least-connection.

### 2.2. Workload Dynamics

Evaluating these scorers involves dynamic "load ladders" (e.g., stepping from 1.0 to 5.0 RPS seamlessly) and heterogeneous request shapes:
- `num_groups` (system prompt variations)
- `system_prompt_len` (prefill length)
- `question_len` (user query length variance)
- `output_len` (generation variance)
- `enable_multi_turn_chat` (conversational history)

## 3. User Stories

1. **As a Config Tuner**, I want to compare P50, P95, and P99 TTFT/TPOT across Predicted Latency, Load+Prefix, and Default load balancing strategies under the same workload scenario, so I can justify the switch to ML-based routing.
2. **As a Stack Operator**, I want to visualize the "Prediction Accuracy" (Predicted Latency vs. Actual Latency) over the course of a benchmark run, so I can ensure the online-trained XGBoost model adapts correctly to sudden traffic spikes.
3. **As a Benchmark Developer**, I need to dissect the performance of these schedulers across specific workload profiles (e.g., cache-friendly vs. cache-intensive scenarios indicated by `num_groups` and prompt variability).

## 4. Functional Requirements

### 4.1. Data Ingestion & Metadata Normalization

Prism must ingest the following fields to accurately represent this feature space:

| Field | Source / Origin | Description |
| :--- | :--- | :--- |
| `routing_strategy` / `scorer` | EPP Config | E.g., `predicted-latency`, `load-prefix_1-1-1`, `round-robin`. |
| `traffic_profile` | Benchmark Config | Identifier for the scenario (e.g., `scenario-a-cache-friendly`, `production-ladder`). |
| `slo_target` | Benchmark Config | The target latency headroom the scheduler was optimizing for, if applicable. |
| `predicted_ttft` | Inference Gateway | The predicted TTFT outputted by the model during routing. |
| `predicted_tpot` | Inference Gateway | The predicted TPOT outputted by the model during routing. |

### 4.2. Analysis & Visualization Features

To fully capture the value of ML-based scheduling, Prism needs to visualize both **macro-level comparisons** and **micro-level prediction accuracy**.

#### 4.2.1. Routing Strategy Comparison View (Macro)

- **Purpose**: Direct comparison of E2E Latency, TTFT, and TPOT percentiles across different load balancers.
- **Visualization**: Stacked or grouped bar charts comparing `predicted-latency` vs. `load-prefix` across various RPS tiers (the "load ladder").
- **Key Insight**: Highlighting the percentage improvement in P50 and P99 metrics at peak load.

#### 4.2.2. Prediction Tracking Timeline (Micro)

- **Purpose**: Validating the continuous learning of the XGBoost sidecar.
- **Visualization**: A dual-axis time-series chart.
  - **Primary Y-Axis**: Predicted Latency (Red Line) overlaid with Actual Latency (Blue Line) for TTFT or TPOT.
  - **Secondary Y-Axis**: Instantaneous QPS/RPS to show how prediction tracks with traffic spikes.
  - **Metric Display**: Callouts for MAPE (Mean Absolute Percentage Error) over the run.

#### 4.2.3. Workload Attribute Filtering

- The benchmark filter panel must expose granular parameters: `num_groups`, `system_prompt_len`, and `multi_turn` flags to allow analysts to quickly subset "Scenario A" versus "Scenario D" as defined in the llm-d benchmark specifications.

## 5. Directory & Schema Support

- **Parser Updates**: `src/utils/dataParser.js` must be updated to parse sidecar prediction logs or metadata tags indicating the `routing_strategy`.
- **Time-Series Overlays**: Existing latency timeline components need to easily accept a secondary `predicted_*` metric for overlay visualization.

## 6. Open Questions

- **Data Volume**: Time-series charting of predicted vs. actual latency on a per-request basis could produce massive data payloads. Should Prism downsample this on ingestion or rely on pre-aggregated bins?
- **Headroom Reporting**: Do we need to visualize the remaining capacity ("positive headroom") of individual pods to show exactly *why* a request was routed there?

## 7. References

- **[Predicted-Latency Based Scheduling for LLMs](https://llm-d.ai/blog/predicted-latency-based-scheduling-for-llms)**: llm-d blog post outlining the gateway-api-inference-extension architecture and scenario definitions.
