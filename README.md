# Chat4U

Chat4U is a lightweight, containerized Flask web application designed as an interactive template for automated CI/CD deployment testing. It includes a built-in chat interface, a robust unit test suite, and a fully configured GitHub Actions pipeline for automated builds, semantic versioning, and publishing to GitHub Container Registry (GHCR).

---

## Table of Contents
- [Description](#description)
- [Installation](#installation)
- [Usage](#usage)
  - [Running Locally](#running-locally)
  - [Running with Docker](#running-with-docker)
- [CI/CD Pipeline & GitHub Actions](#cicd-pipeline--github-actions)
- [Roadmap](#roadmap)
- [Project Status](#project-status)
- [Authors](#authors)
- [Support](#support)

---

## Description

Chat4U provides an easy-to-deploy interactive chat assistant. It features:
- A Flask-based back-end servicing API endpoints.
- A fully responsive HTML5/CSS3 frontend chat interface.
- Complete containerization using Docker.
- Automated testing, semantic tagging, and container publishing on pushes to the `kartik` branch.

---

## Installation

### Prerequisites
- Python 3.11+
- Pip (Python Package Installer)
- Git (optional, for version control)

### Setup Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/kart1k3y/chat4u.git
   cd chat4u
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

---

## Usage

### Running Locally
To launch the development server locally, run:
```bash
python app.py
```
Open your browser and navigate to `http://localhost:5000` to interact with the application.

### Running with Docker
1. **Build the Docker image locally:**
   ```bash
   docker build -t chat4u:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -p 5000:5000 chat4u:latest
   ```

---

## CI/CD Pipeline & GitHub Actions

The project includes an automated pipeline configured in `.github/workflows/ci-cd.yml`:
- **Testing**: Every Pull Request and Push to the `kartik` branch executes the unit test suite automatically.
- **Versioning**: Commits pushed directly or merged to `kartik` are automatically tagged using Semantic Versioning (SemVer).
- **Publishing**: The Docker image is built and pushed directly to the **GitHub Container Registry (GHCR)** at `ghcr.io/kart1k3y/chat4u`.

---

## Roadmap

- [ ] Integrate database storage (e.g., SQLite or PostgreSQL) to persist chat logs.
- [ ] Connect with external LLM APIs (like Gemini or OpenAI) for advanced responses.
- [ ] Implement user authentication and session management.
- [ ] Enhance front-end dashboard UI with modern framework integration (such as React or Vue).

---

## Project Status

**Active Development**: The foundation, containerization structure, test suite, and automated CI/CD pipeline are fully implemented. Next steps focus on database integration and expanding API assistant features.

---

## Authors

- **Vaibhav**
- **Ayush**
- **Ishak**
- **Kartik**

---

## Support

For issues, questions, or feature requests:
- Open an issue in the repository.
- Reach out to any of the project authors.
