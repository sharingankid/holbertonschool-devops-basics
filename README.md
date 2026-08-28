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

- **Docker layer caching** — Docker reuses unchanged steps from a previous build instead of redoing them. Like reheating yesterday's soup instead of cooking it from scratch — only the parts you actually changed get remade.
- **Multi-stage builds** — One Dockerfile stage compiles the app with all its build tools, then a second, minimal stage copies over only the finished binary. Like a construction site handing over the finished house while the scaffolding, cement mixer, and sawdust stay behind at the yard.
- **`.dockerignore`** — A list of files and folders excluded from the build context sent to the Docker daemon (`.git`, logs, local secrets, big local-only data). Like leaving your junk drawer out when you photograph a room for a listing — it never needed to be in the picture.
- **Layer immutability & "whiteout" deletes** — Once a layer is committed, its bytes are baked in forever; deleting a file in a later `RUN` only hides it, it doesn't shrink the image. Like shredding a document after mailing a copy — the copy already left the building, no matter what you do to the original.
- **Collapsing RUN steps** — Combining create/use/delete into one `RUN` instruction means only the final state is ever committed to a layer. Like packing and unpacking a suitcase in a single motion so the mess never actually gets photographed.
- **Base image selection** — Choosing the smallest base image (e.g. Alpine over Debian/Ubuntu) that still satisfies real runtime requirements like glibc compatibility. Like picking the smallest toolbox that still has every tool the job actually needs, instead of hauling the whole garage.
- **Image tag vs. digest** — A tag (`alpine:3.22`) is a movable label that can be repointed; a digest (`@sha256:...`) pins one exact, immutable image. Like the difference between "meet me at the coffee shop" (which could change owners) and a GPS coordinate that never moves.
- **Linux network inspection (`ip`, `ss`, `getent`, `ping`)** — Commands that read a host's own interfaces, routes, neighbors, open ports, and name resolution without touching any remote service. Like checking your own home's fuse box, doorbell, and mailbox before ever calling a neighbor.
- **Load balancing & redundancy** — Spreading traffic across multiple identical servers (e.g. round robin) so no single machine is a single point of failure. Like a restaurant with several cash registers open at once instead of forcing every customer through one line.
- **Tiered web architecture (web / app / database)** — Splitting a stack into independently scalable layers, each fronted by redundancy, instead of running everything on one box. Like a restaurant separating the dining room, kitchen, and pantry so each can be staffed and expanded on its own schedule.

## 📬 Contact

- 💬 Discord: kevin_rigal
- 📧 Email: kevinrigal.contact@gmail.com
- 🐙 GitHub: [@sharingankid](https://github.com/sharingankid)
