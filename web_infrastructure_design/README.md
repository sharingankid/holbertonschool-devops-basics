# web_infrastructure_design

Four progressively more complex designs of the infrastructure behind `www.foobar.com`, moving from everything on a single machine to a redundant, protected, and finally fully tiered multi-server system. Each task has a matching `.mmd` Mermaid file, reproduced inline below so the diagrams render directly on GitHub — the `.mmd` file itself is always the source of truth. The notes under each diagram cover the concept it introduces: DNS, redundancy, firewalls/HTTPS, monitoring, and tiering.

## Diagrams

| File | Design |
|---|---|
| [`single_server_stack.mmd`](./single_server_stack.mmd) | Everything (web, app, database) on one machine — the baseline, with no redundancy. |
| [`redundant_web_tier.mmd`](./redundant_web_tier.mmd) | Adds a load balancer and a second active web/app node, plus a database replica. |
| [`protected_monitored_stack.mmd`](./protected_monitored_stack.mmd) | Adds firewalls, HTTPS, and a monitoring system collecting metrics from every component. |
| [`separated_tiers.mmd`](./separated_tiers.mmd) | Splits web, application, and database into independent, redundant tiers with a failover load-balancer pair. |

---

## 0. Model a Single-Server Web Stack

File: [`single_server_stack.mmd`](./single_server_stack.mmd)

```mermaid
flowchart LR
    User["User"]
    Domain["www.foobar.com"]
    DNS["DNS"]

    subgraph Server["Server (single machine)"]
        direction LR
        Web["Web server (Nginx)"]
        App["Application server"]
        Code["Application code"]
        DB[("Database (PotsgreSQL/MySQL)")]

        Web --> App
        App --> Code
        Code --> DB
    end

    User -->|"1: request"| Domain
    Domain -->|"2: name lookup"| DNS
    DNS -->|"A record &rarr; 8.8.8.8"| Web

    DB -.->|"6: result"| Code
    Code -.->|"5: response"| App
    App -.->|"4: response"| Web
    Web -.->|"3: response"| User
```

### Server: physical or virtual, OS, data center, vs. services

- **Physical or virtual** — A server is a machine, physical (bare metal) or
  virtual (a slice of a physical machine's resources managed by a
  hypervisor). From the outside, both behave the same way: they accept
  requests on a network and answer them.
- **Operating system** — A server always runs an OS (e.g. Linux) that
  manages its hardware or virtual resources, schedules processes, and lets
  other software — like the web server and application server — run on
  top of it.
- **Data center** — A server is commonly hosted in a data center: a
  facility that provides power, cooling, physical security, and network
  connectivity so the machine stays reachable and running.
- **Server vs. services** — The server is the machine; the web server,
  application server, and database are software processes ("services")
  installed and run on that machine. One server can host several services
  at once, which is exactly what happens here.

### DNS and the A record

DNS translates a human-readable domain name into the IP address a client
needs to open a network connection. When the user's browser looks up
`www.foobar.com`, DNS returns the address of the server that hosts the
site. Here that record is an **A record** — the DNS record type that maps
a name directly to an IPv4 address (`8.8.8.8`) — because the `www` host
needs to resolve straight to the server's IP, not to another domain name
(which would instead be a CNAME).

### Roles of the components inside the server

- **Web server (Nginx)** — Accepts incoming HTTP(S) connections, and
  serves static files directly or forwards dynamic requests to the
  application server.
- **Application server** — Executes the application code needed to build
  a dynamic response (business logic), separate from the job of speaking
  HTTP to clients.
- **Application code** — The actual program logic (e.g. a Python/PHP/Node
  codebase) that the application server runs to process a request.
- **Database (PostgreSQL/MySQL)** — Stores and retrieves the persistent
  data the application needs (users, content, etc.), separate from the
  code that uses it.

### Network communication: TCP/IP

The user and the server are two different machines connected by a
network, not by direct memory access. They exchange data using the
TCP/IP protocol suite: IP handles addressing and routing packets between
the two machines, and TCP on top of it guarantees the bytes arrive
in order and without loss, which is what lets HTTP work reliably.

### LAMP, and why this is only LAMP-like

**LAMP** is a classic web-stack acronym for **L**inux (OS) + **A**pache
(web server) + **M**ySQL (database) + **P**HP (application
language/runtime). This design is **LAMP-like**, not a literal LAMP
stack: it keeps the same layering (OS, web server, database, application
code) and can run on Linux with MySQL, but it swaps Apache for **Nginx**
and does not commit to PHP — the application server/code can be written
in any language. "LAMP-like" describes the shape of the stack, not this
exact set of technologies.

### Limitations

- **Single point of failure (SPOF)** — Everything (web server,
  application server, application code, database) runs on one server. If
  that machine, its OS, or any one of those services crashes, the whole
  site goes down.
- **Downtime during maintenance** — Any update, patch, restart, or
  reconfiguration of the server has to happen on the machine that is
  currently serving traffic, so maintenance directly causes downtime.
- **No capacity to scale** — All traffic is handled by one server's
  finite CPU, memory, and network capacity. When traffic grows beyond
  what that single machine can handle, requests slow down or fail, and
  there is no second server to absorb the extra load.

---

## 1. Add Redundancy and Traffic Distribution

File: [`redundant_web_tier.mmd`](./redundant_web_tier.mmd)

```mermaid
flowchart LR
    User["User"]
    Domain["www.foobar.com"]
    DNS["DNS"]
    LB["Load balancer (HAProxy)"]

    subgraph Node1["Web/App node 1"]
        direction LR
        Web1["Web server (Nginx)"]
        App1["Application server"]
        Web1 --> App1
    end

    subgraph Node2["Web/App node 2"]
        direction LR
        Web2["Web server (Nginx)"]
        App2["Application server"]
        Web2 --> App2
    end

    DBP[("Database primary (MySQL)")]
    DBR[("Database replica (MySQL)")]

    User -->|"1: request"| Domain
    Domain -->|"2: name lookup"| DNS
    DNS -->|"A record &rarr; 8.8.8.8"| LB

    LB -->|"distribute"| Web1
    LB -->|"distribute"| Web2

    App1 --> DBP
    App2 --> DBP
    DBP -->|"replication"| DBR

    DBP -.->|"response"| App1
    DBP -.->|"response"| App2
    App1 -.->|"response"| Web1
    App2 -.->|"response"| Web2
    Web1 -.->|"response"| LB
    Web2 -.->|"response"| LB
    LB -.->|"response"| User
```

### Why the load balancer and the redundant paths were added

The single-server design had one path from the entry point to the
database, so any failure or overload of that one path took the whole
site down. Adding a **load balancer** in front of **two** identical
web/application paths removes that dependency on any single web or
application server: if one path fails, the other can still serve
traffic, and normal traffic can be split across both, increasing total
capacity.

### Active-active vs. active-passive

The two web/application paths here are **active-active**: both
`Web/App node 1` and `Web/App node 2` are up and receiving real traffic
from the load balancer at the same time. This is different from
**active-passive**, where one path handles all traffic and the second
sits idle, only taking over if the first one fails. Active-active uses
both nodes' capacity continuously; active-passive keeps a node in
reserve purely for failover.

### Load-distribution method: round robin

One common method is **round robin**: the load balancer sends each new
request to the next server in the list, cycling back to the first once
it reaches the last (node 1, then node 2, then node 1 again, and so on).
It is simple and spreads requests evenly when the nodes are similarly
sized and requests are roughly uniform in cost.

### Database primary, replica, and replication

**Database primary (MySQL)** is the database instance that the
application servers write to and read from. **Database replica (MySQL)**
is a copy that continuously receives changes from the primary through
**replication** — a one-way flow that keeps the replica's data in sync
with the primary's. Replication here only copies data; it does not by
itself make the replica take over write traffic if the primary goes
down. No automatic failover is implied — that would require a separate
mechanism.

### Remaining single points of failure

- The **load balancer** is now the single entry point for all traffic:
  if it fails, both web/application paths become unreachable.
- The **database primary** is the only node in the diagram that accepts
  writes: if it fails, the application can no longer write data, even
  though the replica still holds a readable copy.

### Remaining limitations

Traffic still travels in the clear (**no HTTPS**), there are **no
firewalls** filtering or restricting access to any component, and there
is **no monitoring** in place to detect failures, saturation, or unusual
traffic before they cause an outage.

### Cost of redundancy

Adding a load balancer and a second web/application path improves
availability (a failure in one path no longer takes the site down) and
capacity (two nodes can serve more traffic than one). That benefit comes
with a real cost: more servers to provision, patch, and pay for, and
more moving parts (load-balancer configuration, replication) to operate
and monitor.

---

## 2. Add Protection and Observability

File: [`protected_monitored_stack.mmd`](./protected_monitored_stack.mmd)

```mermaid
flowchart LR
    User["User"]
    Domain["www.foobar.com"]
    DNS["DNS"]
    FW0["Firewall"]
    LB["Load balancer (HAProxy)"]
    FW1["Firewall"]
    FW2["Firewall"]
    Mon["Monitoring system"]

    subgraph Node1["Web/App node 1"]
        direction LR
        Web1["Web server (Nginx)"]
        App1["Application server"]
        Web1 --> App1
    end

    subgraph Node2["Web/App node 2"]
        direction LR
        Web2["Web server (Nginx)"]
        App2["Application server"]
        Web2 --> App2
    end

    DBP[("Database primary (MySQL)")]
    DBR[("Database replica (MySQL)")]

    User -->|"1: request"| Domain
    Domain -->|"2: name lookup"| DNS
    DNS -->|"A record &rarr; 8.8.8.8"| FW0
    User -->|"HTTPS"| FW0

    FW0 --> LB
    LB --> FW1
    LB --> FW2
    FW1 --> Web1
    FW2 --> Web2

    App1 --> DBP
    App2 --> DBP
    DBP -->|"replication"| DBR

    DBP -.->|"response"| App1
    DBP -.->|"response"| App2
    App1 -.->|"response"| Web1
    App2 -.->|"response"| Web2
    Web1 -.->|"response"| FW1
    Web2 -.->|"response"| FW2
    FW1 -.->|"response"| LB
    FW2 -.->|"response"| LB
    LB -.->|"response"| FW0
    FW0 -.->|"response"| User

    LB -.->|"metrics"| Mon
    Web1 -.->|"QPS metrics"| Mon
    Web2 -.->|"metrics"| Mon
    App1 -.->|"metrics"| Mon
    App2 -.->|"metrics"| Mon
    DBP -.->|"metrics"| Mon
```

### What a firewall does and does not do

A **firewall** inspects traffic at the network/transport level and
allows or blocks it based on rules such as source, destination, and
port. It does **not** inspect or understand the content of an
application request, authenticate users, encrypt traffic, or protect
against a vulnerability in the application code itself — it only decides
whether a connection is allowed to reach the component behind it.

### Why HTTPS

**HTTPS** wraps the HTTP traffic between the user and the entry firewall
in TLS encryption, so the request and response cannot be read or altered
by anyone intercepting the connection in transit. It also lets the user
verify they are actually talking to `www.foobar.com` and not an
impostor.

### How monitoring collects data

Each monitored component (load balancer, web servers, application
servers, database primary) runs a small **monitoring client or agent**
that periodically reads local metrics (requests handled, response
times, resource usage, query counts, etc.) and pushes or exposes them so
the **monitoring system** can pull or receive that data over the
network, independent of the user traffic flowing through the stack.

### QPS

**QPS (queries per second)** measures how many requests a component
handles each second. Tracking QPS over time makes it possible to see
traffic climbing before it becomes a problem, spot sudden spikes or
drops that indicate an incident, and judge whether current capacity is
close to its limit.

### TLS termination at the load balancer

If TLS is terminated at the load balancer, the connection from the user
is encrypted only as far as the load balancer. Unless the load balancer
re-encrypts traffic for the next hop, the connection from the load
balancer onward to the firewalls, web servers, and application servers
travels **unencrypted** on the internal network — a real exposure if
that internal network cannot be fully trusted.

### The writable primary as a risk

Even with a load balancer, firewalls, and monitoring in place, there is
still exactly **one** database node that accepts writes — the primary.
None of the added components change that: if the primary becomes
unreachable, the application loses the ability to write data regardless
of how much read-side or network redundancy exists elsewhere.

### Collocated services and independent scaling/maintenance

Within each `Web/App node`, the web server and application server still
sit on the same machine as each other, and the database is a separate
but singular pair of machines. Because these services are collocated
rather than deployed as independently addressable tiers, scaling one of
them (e.g. adding more application-server capacity without adding more
web-server capacity) or maintaining one of them without disturbing the
other is harder — a change or restart to one service risks affecting
the other service sharing the same machine.

---

## 3. Separate Tiers and Remove the Load-Balancer SPOF

File: [`separated_tiers.mmd`](./separated_tiers.mmd)

```mermaid
flowchart LR
    User["User"]
    Domain["www.foobar.com"]
    DNS["DNS"]
    LB1["Load balancer (HAProxy)"]
    LB2["Load balancer (HAProxy)"]

    User -->|"1: request"| Domain
    Domain -->|"2: name lookup"| DNS
    DNS -->|"A record &rarr; 8.8.8.8"| LB1
    LB1 <-->|"failover"| LB2

    subgraph WebTier["Web tier"]
        direction LR
        Web1["Web server (Nginx)"]
        Web2["Web server (Nginx)"]
    end

    subgraph AppTier["Application tier"]
        direction LR
        App1["Application server"]
        App2["Application server"]
    end

    subgraph DBTier["Database tier"]
        direction LR
        DBP[("Database primary (MySQL)")]
        DBR[("Database replica (MySQL)")]
    end

    LB1 -->|"distribute"| Web1
    LB1 -->|"distribute"| Web2
    Web1 --> App1
    Web2 --> App2
    App1 --> DBP
    App2 --> DBP
    DBP -->|"replication"| DBR

    DBP -.->|"response"| App1
    DBP -.->|"response"| App2
    App1 -.->|"response"| Web1
    App2 -.->|"response"| Web2
    Web1 -.->|"response"| LB1
    Web2 -.->|"response"| LB1
    LB1 -.->|"response"| User
```

### Comparison with the single-server design

The single-server design ran the web server, application server,
application code, and database as processes on one machine — one thing
to fail, one thing to maintain, one thing to run out of capacity. Here
the same responsibilities are spread across a **web tier**, an
**application tier**, and a **database tier** of dedicated machines,
each fronted by a load-balancer pair that itself has a `failover`
partner, so no single machine failure removes an entire capability from
the system the way it did in task 0.

### Independent scaling

Because the web tier, application tier, and database tier are now
separate groups of machines rather than colocated services, each tier
can be scaled on its own: if application logic is the bottleneck, more
application servers can be added without touching the web or database
tier, and vice versa. Scaling is driven by which tier is actually
constrained, not by an all-or-nothing copy of the whole stack.

### Maintenance isolation

Taking a machine in one tier out for maintenance — patching a web
server, for instance — no longer risks the application or database
tier, since they run on physically and logically separate machines with
their own remaining redundant instances. The blast radius of a
maintenance operation is limited to the tier (and ideally just the one
instance) being worked on.

### Sizing instance counts

The number of web-server, application-server, or database instances in
a tier should be set from **measured demand** (current traffic and
resource usage), **expected growth** (how much that demand is likely to
increase), **failure tolerance** (how many instances can be lost at once
and still meet demand), and a **justified safety margin** on top of
that — not copied from how many boxes happen to appear in a diagram, and
not simply maximized "to be safe," since every extra instance adds real
infrastructure and operational cost without a guaranteed benefit.

### Remaining limitation

Database **failover is still not automatic**: the primary is still the
only writable node, and promoting the replica if the primary fails would
require a separate, deliberate mechanism that this design does not
include. Separating tiers and pairing the load balancer also adds more
machines to provision, configure, and operate, which increases cost and
operational complexity compared to every earlier design in this
project.

---

📚 See the root [CHEATSHEET.md](../CHEATSHEET.md) for the concepts used here.
