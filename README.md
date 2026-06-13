# Chat4U

[![CI/CD Pipeline](https://github.com/kart1k3y/chat4u/actions/workflows/ci.yml/badge.svg)](https://github.com/kart1k3y/chat4u/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-lightgrey?logo=flask)](https://flask.palletsprojects.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Chat4U is a real-time, WhatsApp-like messenger web application designed as the target application for a college **DevSecOps Capstone Project (CAPSTONE #C06)**. 

The primary deliverable of this project is the DevSecOps pipeline wrapped around the application, which performs automated security scans (static analysis, dependency checking, container scanning, and dynamic penetration testing) and blocks builds if vulnerabilities are detected.

---

## Table of Contents

- [About & Architecture](#about--architecture)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [DevSecOps Security Pipeline](#devsecops-security-pipeline)
- [Team Split & Deliverables](#team-split--deliverables)
- [Installation & Running Locally](#installation--running-locally)
  - [Prerequisites](#prerequisites)
  - [Option 1: Using Docker Compose (Recommended)](#option-1-using-docker-compose-recommended)
  - [Option 2: Native Run (Without Docker)](#option-2-native-run-without-docker)
- [API Contracts Reference](#api-contracts-reference)

---

## About & Architecture

Chat4U supports real-time text chat, group creation, image uploading, and voice note sharing. It is built to present realistic security risks (JWT authentication, WebSockets, file uploads, potential XSS, and path-traversal surfaces) so that security scanners have realistic vulnerability vectors to evaluate.

- **Authentication**: JWT-based session security (token stored in local storage).
- **Real-Time Communication**: Multi-room WebSockets server (`flask-sock` over Gunicorn gthreads).
- **Data Persistence**: PostgreSQL database storing user, message, group, and membership records.
- **Media Storage**: File uploads are processed via REST and stored in `static/uploads/`, with URLs broadcasted to active room sessions.

---

## Tech Stack

| Component | Technology |
|---|---|
| **Backend** | Python 3.11, Flask 3.0.3, Flask-Sock (WebSockets), Gunicorn |
| **Frontend** | Vanilla HTML5, CSS3, ES6 JavaScript (No frameworks) |
| **Database** | PostgreSQL 15 |
| **Containerization** | Docker, Docker Compose |
| **DevSecOps Pipeline** | GitHub Actions, Bandit, Snyk, Trivy, OWASP ZAP |

---

## Key Features

1. **Authentication**: Sleek signup and login panels, hashing passwords securely via `werkzeug.security`.
2. **Text Messaging**: Real-time DM messaging between users over a single persistent WebSocket connection.
3. **Group Chats**: Create groups with searchable member checklists. Selecting a group loads membership information and enables multi-user group chat rooms.
4. **Media Sharing**: 
   - **Images**: Upload PNG, JPEG, GIF, and WEBP formats client-side with upload progress indicators. Click to expand images in a dark full-screen Lightbox overlay.
   - **Voice Notes**: Record audio notes via browser `MediaRecorder` API by holding down the microphone button, then play them back using inline audio elements.
5. **Group Info Side Panel**: A slide-out details panel displaying usernames of all members in the current active group.

---

## DevSecOps Security Pipeline

The application code is automatically scanned on every commit and Pull Request. The pipeline runs the following security suite:

* **Bandit**: Static Application Security Testing (SAST) scanning Python code for insecure code blocks (e.g. `debug=True`, weak hashes, shell injection).
* **Snyk**: Software Composition Analysis (SCA) checking the `requirements.txt` file for known dependency vulnerabilities.
* **Trivy**: Container security scanner assessing the built Docker image for OS package and layer CVEs.
* **OWASP ZAP**: Dynamic Application Security Testing (DAST) executing simulated web attacks (SQLi, XSS, CSRF) on a live running instance of the application.

---

## Team Split & Deliverables

- **Person 1 (Backend)**: Core Flask framework setup, WebSockets backend server, database schemas, REST APIs, and Docker configurations.
- **Person 2 (Frontend Shell)**: Auth views (signup/login), 3-panel message UI layout, WebSockets client, and text message state.
- **Person 3 (Media & Groups)**: Image attachment uploads, voice recording, Lightbox overlay, Create Group modal, and Group Members Info sidebar.
- **Person 4 (DevSecOps Pipeline)**: GitHub Actions integration, security scanner rulesets, vulnerability thresholds, and pipeline build gatekeepers.

---

## Installation & Running Locally

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- (Optional) Python `3.11+` and PostgreSQL if running natively.

### Option 1: Using Docker Compose (Recommended)

This compiles the Flask application, installs PostgreSQL 15, configures the environment variables, runs migrations, and spawns the web application on port `5000` automatically.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kart1k3y/chat4u.git
   cd chat4u
   ```

2. **Start the services**:
   ```bash
   docker-compose up --build -d
   ```

3. **Check the application**:
   Open your browser and navigate to **[http://localhost:5000](http://localhost:5000)**.

4. **Stop the services**:
   ```bash
   docker-compose down
   ```

### Option 2: Native Run (Without Docker)

1. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   ```
2. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Set environment variables (refer to `.env.example`) and start the application:
   ```bash
   python app.py
   ```

---

## API Contracts Reference

All communication follows the fixed schema documented in `contracts.md` at the root of the repository. Do not deviate from these patterns when integrating frontend and backend features.
