# Tiered Prefix Cache well-lit path in Prism
Public/externally accessible
Contributors: Sean Horgan, Nishtha Jain Rajitha Leonhard , Danna Wang, <add your name>
Apr 29, 2026

# Overview
The KV Cache's massive accelerator memory footprint is a primary bottleneck in LLM serving, directly constraining context length, concurrency, and overall system throughput. Prefix Cache Offloading (Tiered Prefix Cache) solves this by extending the KV cache from expensive GPU/TPU HBM to larger, cost-effective tiers like CPU RAM, Local SSDs, and remote storage layers (Managed Lustre). Integrating this into Prism as a well-lit path allows customers to easily visualize and adopt these optimizations, maximizing their cache hit ratios and token/s throughput and unlocking long-context serving on cost-effective hardware like G4s without hitting memory limits. This also allows customers to visualize their efficiency gains (through TTFT, token/s, ITL metrics) and therefore, allow them to utilize their hardware (TPUs or GPUs) to the max.

# Business Impact Metrics
- Performance Gains (TTFT, Token/s throughput, ITL): Measured directly via inference-perf benchmark tool and stored in the llm-d Results Store GCS bucket.
- Cost-to-Serve (Cost per 1M Tokens): By increasing throughput and enabling long-context workloads to run on cheaper G4/RTX-PRO-6000 instances (rather than forcing an upgrade to less available & more expensive machines with A3/H100s), the cost per token decreases dramatically. We will measure this by calculating the hardware hourly rate divided by the improved token throughput. As an example, we already have proven TCO gains with KVCache offloading to Managed Lustre.
- Feature Adoption Rate: We need to track how often customers are exploring and adopting this well-lit path. We will measure this by leveraging the existing Google Analytics in Prism to track page views, configuration toggles, and clicks on the reproducibility action links. We still need to figure out how we associate activity in prism with downstream engagement in cloud layer, e.g. provisioning infra.

# Jobs To Be Done (CUJs)
## CUJ 1: Evaluate Tiered Storage Performance

User Role: Stack Operator (AI/ML Infrastructure Engineer)
Goal: Understand the performance trade-offs (Time to First Token, Throughput) of offloading KV cache to CPU RAM or Local SSD compared to an HBM-only baseline for large context workloads.
Note: we should include workloads where it does not make sense to deploy kv cache offloading, e.g. kv cache << HBM 
Pain Points: Running manual benchmarks across multiple storage tiers and context lengths is incredibly time-consuming, error-prone, and difficult to reproduce.


## CUJ 2: Compare these results to my configuration

User Role: Stack Operator (AI/ML Infrastructure Engineer)
Goal: Understand the price/performance difference between the configuration benchmarked in the guide and my custom configuration which will use different models, machines, and workloads.
Pain Points: Knowledge of the detail configuration in the benchmark, e.g. specific vLLM version & kernels 

Some ideas brainstormed between Sean & Rajitha
Use AI to prepopulate a FAQ for common comparisons germane to this guide. E.g. how would gemma4-31B perform under the same configuration
Make it easier to share the benchmark details with an agent
Embed AI/agent directly in the UX

Brainstorm during sync-up
Direct user to a deploy planner app. Here’s the source: llm-d-planner 

## CUJ 3: Reproduce Tiered Prefix Benchmarks

User Role: AI Platform Architect
Goal: Validate published benchmarks using their exact workloads and infra.
Pain Points: Strict, smaller HBM limits on G4 hardware severely restrict the number of concurrent long-context requests that can be served, traditionally forcing an expensive hardware scale-up to A3/H100 clusters.

# Detailed Specifications

## General flow
Data Source & Pipeline: The inference-perf (run with llm-d-benchmark) tool will generate standardized output containing all the results data. 
Results Publication: Establish a pipeline (Staging Bucket -> Review -> Production) to run combinations of models, accelerators, and storage tiers and publish them to the llm-d results store GCS bucket.
Prism UI/UX: The dashboard will feature dropdown menus allowing users to select between baseline, CPU offload, and CPU+storage optimization options. There will not be options to select between other options like different models, machine types in the initial release.
Metrics Extraction: The backend must parse the llm-d benchmark output to extract Input Token Throughput (tokens/s), Time to First Token (TTFT), and End-to-End Latency.


## Benchmarks

Prism Guide Details: Prefix Cache Offloading
We’ll ship the guide specified below as the “Prefix Cache Offloading” well-lit path experience in Prism:

Guide Overview This guide demonstrates how to extend the KV Cache from HBM to other cost-effective tiers (CPU RAM, Local SSDs and Managed Lustre) using KV plug-ins (LMCache, tpu-inference and FS-connectors). By enabling tiered prefix caching, you can serve larger context windows and increase concurrency on cost-effective G4 instances, drastically improving throughput and TTFT for long-prompt workloads that would otherwise OOM.

## Selectable List of Optimizations

Baseline (HBM Only)
- Tiered Cache: CPU RAM (View llm-d CPU Offloading Guide)
- Tiered Cache: CPU RAM + Managed Lustre

Future options / maybe list as “Contact Us or Contribute”
- Tiered Cache: Local SSD
- Tiered Cache: Cloud Storage (e.g. GCS Rapid Cache)


## Benchmark Scenario

Infra layer: GCP: g4-standard-384 (8x nvidia-rtx-pro-6000).
Model serving layer: google/gemma4-31B (FP8), Parallelism Strategy: TP: 8, Model serving engine: vLLM (with FS-connector).
Workload: inference-perf (migrated from SGLang bench_serving), Use case: generated-shared-prefix, Input sequence lengths: 10k, 50k, 100k tokens.

## Primary Outcomes

Input Token Throughput (tokens/s): Highlights the massive throughput gains when serving long contexts, especially where the baseline fails.
Time to First Token (TTFT): Highlights the latency reduction achieved by avoiding recomputation of large prefixes.
Inter Token Latency (ITL): Highlights the time elapsed between generating consecutive tokens, useful for measuring how effectively the cache is managed, especially in agentic workloads.

Action *Reproduce this benchmark with llm-d

## Key Charts

Throughput vs. Context Length (Bar Chart): Compares Input Token Throughput across Baseline, CPU RAM, and CPU RAM + LSSD for 10k, 50k, and 100k prompt lengths. (Will visually highlight where Baseline hits OOM).
TTFT Reduction (Bar Chart): Compares TTFT across the three storage configurations, highlighting the dramatic drop in latency for 50k and 100k prompts when using Local SSD.
ITL Reduction (Bar Chart): Compares ITL across the three storage configurations, highlighting the dramatic drop in latency for 50k and 100k prompts when using Local SSD.

## Summary Metrics Comparison 
(Illustrative for G4 / Gemma4-31B) (Note: Exact numbers to be dynamically pulled from the GCS result store upon completion of the G4 automated runs. The table below illustrates the expected narrative where G4's smaller VRAM causes early OOMs on the baseline).

Metric
Baseline (HBM Only)
Tiered Cache (CPU RAM)
Tiered Cache (CPU RAM + Lustre)
Throughput (10k tokens)
[Baseline tok/s]
[+X% tok/s]
[+Y% tok/s]
Throughput (50k tokens)
OOM (Exceeds G4 VRAM)
[Recovered tok/s]
[Maximized tok/s]
TTFT (10k tokens)
[Baseline ms]
[-X% ms]
[-Y% ms]
TTFT (50k tokens)
OOM (Exceeds G4 VRAM)
[Recovered ms]
[Minimized ms]
ITL (10k tokens)
[Baseline ms]
[-X% ms]
[-Y% ms]
ITL (50k tokens)
OOM (Exceeds G4 VRAM)
[Recovered ms]
[Minimized ms]


# References
Llm-d guides
Tiered Prefix Cache CPU Guide (llm-d.ai)
https://github.com/llm-d/llm-d/tree/main/guides/tiered-prefix-cache/storage#benchmarking 

vllm guides
https://github.com/vllm-project/production-stack/blob/main/tutorials/cloud_deployments/04-GCP-GKE-lmcache-local-disk.md 

Related blog posts
https://cloud.google.com/blog/products/storage-data-transfer/choosing-google-cloud-managed-lustre-for-your-external-kv-cache?e=48754805 
https://blog.lmcache.ai/en/2025/10/07/lmcache-on-google-kubernetes-engine-boosting-llm-inference-performance-with-kv-cache-on-tiered-storage/ 

