# Chat4U

[![CI/CD Pipeline](https://github.com/kart1k3y/chat4u/actions/workflows/ci.yml/badge.svg)](https://github.com/kart1k3y/chat4u/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-lightgrey?logo=flask)](https://flask.palletsprojects.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Flask-based interactive chatbot assistant built as a cloud-native, end-to-end **DevSecOps pipeline demonstration** for Capstone #C06. Chat4U covers containerization, automated CI/CD, Kubernetes orchestration, and observability with Prometheus and Grafana.

---

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Running with Docker](#running-with-docker)
- [CI/CD Pipeline](#cicd-pipeline)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Project Status](#project-status)

---

## About

Chat4U is a web-based assistant that responds to user messages about GitHub Actions, Docker, and Semantic Versioning. It demonstrates how a simple Python web app can be containerized, continuously integrated, security-scanned, and released automatically using modern DevOps tooling.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, Flask 3.0.3, Gunicorn |
| Containerization | Docker, Docker Desktop |
| CI/CD | GitHub Actions, Flake8, Docker Buildx |
| Registry | Docker Hub (Semantic Versioning + SHA tags) |
| Security Scanning | Bandit, Snyk, Trivy, OWASP ZAP *(Capstone C06)* |
| Orchestration | Kubernetes *(Phase 2)* |
| Monitoring | Prometheus, Grafana *(Phase 3)* |

---

## Installation

### Prerequisites

- Python `>= 3.11`
- `pip`
- Docker Desktop *(for containerized runs)*

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kart1k3y/chat4u.git
   cd chat4u
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # macOS / Linux
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

## Usage

Start the application locally:

```bash
python app.py
```

Open your browser and navigate to:

```
http://localhost:5000
```

Type a message in the chat input to interact with the assistant. It responds to topics like **Docker**, **GitHub Actions**, **Semantic Versioning**, and more.

---

## Running with Docker

### CLI

```bash
# Build the image
docker build -t chat4u .

# Run the container
docker run -d -p 5000:5000 --name chat4u-app chat4u
```

Then visit `http://localhost:5000` in your browser.

### Docker Desktop (GUI)

1. Open **Docker Desktop** and go to the **Images** tab.
2. Find the `chat4u` image and click the **Run** button.
3. Under **Optional settings**, set:
   - **Host port**: `5000`
   - **Container name**: `chat4u-app`
4. Click **Run** and click the port link to open the app in your browser.

---

## CI/CD Pipeline

The pipeline is defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

| Job | Trigger | Description |
|---|---|---|
| `lint` | Every push and PR | Runs `flake8` with `pip` caching |
| `docker-build-push` | Push to `main` or `v*.*.*` tag | Builds image, tags with SHA and SemVer, pushes to Docker Hub |
| `github-release` | Push of `v*.*.*` tag | Auto-generates GitHub Release with changelog |

### Required Secrets

Add these under **Settings > Secrets and variables > Actions**:

| Secret | Description |
|---|---|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub access token |
| `SNYK_TOKEN` | Your Snyk API token (for security scanning) |

### Creating a Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the full pipeline: lints the code, builds and pushes the Docker image, and creates a versioned GitHub Release automatically.

---

## Roadmap

- [x] **Phase 1** — CI/CD Pipeline with Docker (containerize, lint, build, tag, release)
- [ ] **Phase 2** — Kubernetes Orchestration (deployments, services, ingress, scaling)
- [ ] **Phase 3** — Observability with Prometheus and Grafana (metrics, dashboards)
- [ ] **Capstone #C06** — Full DevSecOps scanning (Bandit, Snyk, Trivy, OWASP ZAP)

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'feat: add your feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a Pull Request.

Please ensure your code passes the `flake8` linter before submitting a PR.

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

## Project Status

**Phase 1 - Active Development**

The CI/CD pipeline with Docker is fully operational. Phase 2 (Kubernetes) and Phase 3 (Monitoring) are planned for future sprints.
