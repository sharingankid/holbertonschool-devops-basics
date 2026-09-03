# holbertonschool-devops-basics

Hands-on DevOps fundamentals: Docker image optimization, basic Linux networking, and web infrastructure design.

> 🎓 Part of the Software Engineering curriculum at **Holberton School Toulouse**.

![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![Bash](https://img.shields.io/badge/Bash-4EAA25?style=flat&logo=gnubash&logoColor=white)
![Mermaid](https://img.shields.io/badge/Mermaid-FF3670?style=flat&logo=mermaid&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat&logo=linux&logoColor=black)

## 📖 About

This repo covers three core DevOps building blocks: shrinking and hardening Docker images, reading a Linux host's own network configuration, and designing web infrastructure that scales from one server to a redundant, monitored, multi-tier system. Each topic is a self-contained set of exercises with real Dockerfiles, shell scripts, small Go/Node/Python apps, and Mermaid architecture diagrams — not just notes. The goal is to understand *why* each technique or design choice matters, not just how to apply it.

## 📂 Project Structure

| Directory | Description |
|---|---|
| `docker_image_optimization/` | Labs on shrinking, securing, and speeding up Docker builds (layer caching, multi-stage builds, base image selection, build context control) using small Go, Node, and Python sample apps. |
| `exploring_your_first_network/` | Small Bash scripts that inspect a Linux host's own network setup: interfaces, links, routes, neighbors, listening TCP sockets, and hostname resolution. |
| `web_infrastructure_design/` | Four progressively more complex Mermaid diagrams (`.mmd`) modeling the infrastructure behind `www.foobar.com`, from a single server to a tiered, redundant, monitored architecture. |

## 🧠 Cheat Sheet

All the key concepts from this repo, explained with analogies → **[CHEATSHEET.md](CHEATSHEET.md)** ([🇫🇷 version française](CHEATSHEET.fr.md))

## 📬 Contact

- 💬 Discord: kevin_rigal
- 📧 Email: kevinrigal.contact@gmail.com
- 🐙 GitHub: [@sharingankid](https://github.com/sharingankid)
