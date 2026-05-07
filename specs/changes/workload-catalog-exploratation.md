I want to build a "card catalog" experience that enables users to browse the different workload catalog items listed in the attached doc. 

## Key user journeys
- User can see an overview of the catalog and browse the full list  of workloads
- User can select and view the details of a card
- User can navigate back to the catalog
- User can copy the URL for catalog item

## General requirements
- Leverage the same styles, colors, and UX found in https://prism.llm-d.ai (code is in https://github.com/llm-d/llm-d-prism) as this app will be embedded in that UX. 
- Catalog items should follow a "card" style which means there is a short snippet of information relevant for the key journey

## Catalog Home
Include some explanatory copy so the user knows what they are looking at in the main page. Provide a link in the overview to the primary github page: https://github.com/kubernetes-sigs/inference-perf/tree/main/workload-catalog. 

## Catalog Cards
Each card should have the following:
- Unique URL that enables linking to from other experiences in prism. 
- Link to the github page for that card: https://github.com/kubernetes-sigs/inference-perf/tree/main/workload-catalog/code-generation.
- Cover all the details in the card as specified in the Catalog doc


