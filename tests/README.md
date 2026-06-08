# 🧪 Agent Sandbox UX Testing Guide

This directory and guide explain the structure, setup, and execution of unit and End-to-End (E2E) tests for the Agent Sandbox UX console dashboard.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Prerequisites](#prerequisites)
4. [Running the Tests](#running-the-tests)
   - [All Tests](#1-all-tests)
   - [Unit & Component Tests](#2-unit--component-tests)
   - [End-to-End (E2E) Tests](#3-end-to-end-e2e-tests)

---

## 🔍 Overview

To guarantee stability and catch visual regressions or API proxy failures, we maintain two test suites:
1. **Unit & Component Tests (Vitest + React Testing Library):** Verifies React components render correctly, handle expanded states, and fire navigation callbacks based on user clicks in isolation.
2. **End-to-End (E2E) Tests (Playwright):** Launches a headless Chromium browser, boots the dev server under the hood, and simulates real user flows (landing, navigating to telemetry charts, and navigating back).

---

## 📂 Directory Structure

Here is where the testing assets are located:
- **`src/components/__tests__/`**: Hosts component-level unit tests (e.g. [LeftNavigation.test.jsx](../src/components/__tests__/LeftNavigation.test.jsx)).
- **`src/test/setup.js`**: Setup file loaded by Vitest to configure Jest DOM matchers.
- **`tests/e2e/`**: Hosts Playwright E2E browser tests (e.g. [dashboard.spec.js](e2e/dashboard.spec.js)).
- **`playwright.config.js`**: Core Playwright configuration, detailing the test directory, chromium settings, and local Vite dev server bootstrap hooks.

---

## 🛠 Prerequisites

Make sure you have:
1. Node dependencies installed:
   ```bash
   npm install
   ```
2. **Playwright Browsers installed**: Playwright requires browser binaries to run. Install Chromium (used by E2E):
   ```bash
   npx playwright install chromium
   ```

---

## 🏃‍♂️ Running the Tests

We provide npm scripts to run the test suites:

### 1. All Tests (Sequential)
To run both component unit tests and E2E browser tests in a single command, run:
```bash
npm test
```

### 2. Unit & Component Tests
To run component tests in isolation:
```bash
npm run test:unit
```
*Vitest will execute the tests, report the status, and exit.*

### 3. End-to-End (E2E) Tests
To run E2E tests:
```bash
npm run test:e2e
```
*Playwright will automatically spin up the React dev server, execute the browser flows, close the server, and output the report.*
