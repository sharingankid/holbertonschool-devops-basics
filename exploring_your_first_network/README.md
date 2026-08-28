# exploring_your_first_network

Seven small Bash scripts that inspect a Linux host's own network configuration — no remote service is ever touched. Each script wraps a single standard tool (`ip`, `ss`, `getent`, `ping`) to answer one specific question: what interfaces exist, where does traffic default to, who's on the local network, which ports are listening, and whether a hostname resolves.

## Scripts

| Script | What it shows |
|---|---|
| `list_interfaces.sh` | Every network interface and its IP address (`ip -br addr show`). |
| `show_links.sh` | Every network link and its up/down state (`ip -br link show`). |
| `show_default_route.sh` | The default gateway used for outbound traffic (`ip -4 route show default`). |
| `show_neighbors.sh` | The local ARP/neighbor table (`ip -4 neigh show`). |
| `list_listening_tcp.sh` | TCP ports currently accepting connections (`ss -tln`). |
| `resolve_hostname.sh` | The IP address a given hostname resolves to (`getent hosts`). |
| `test_loopback.sh` | Confirms the host's own network stack responds, via `ping` on its own address. |

📚 See the root [CHEATSHEET.md](../CHEATSHEET.md) for the concepts used here.
