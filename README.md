# Beginner Web CTF #2 — SnapNest

A second **beginner-friendly web CTF** in the style of TryHackMe. This time the
app is **SnapNest**, a community photo board (built with Node.js). Your goal is
to find the security flaws hidden inside it and capture the **flags**
(format `FLAG{...}`).

> Still beginner-oriented — no prior knowledge required. What's new this round:
> the app lets you **upload files**. 👀 Great as a follow-up to the first CTF,
> or as a standalone workshop exercise.

## Scenario

SnapNest just came out of a hackathon and went live in a hurry, still in
"staging". People love posting photos, but the team left several loose ends.
Your mission is to act as a penetration tester and find everything that's wrong.

## Ground rules

- Everything you need is reachable from the site. No heavy brute-forcing and no
  denial-of-service — this challenge is about **reasoning and observation**.
- Explore like a curious tester: read the source of pages **and scripts**, play
  with URL parameters, inspect **cookies** and **requests** (DevTools Network
  tab), and test anything that looks "breakable".
- There are **6 flags** in total. Each is worth one point.

## Helpful tools (all free)

- The **browser** and **DevTools** (F12) — *Elements*, *Network*, *Application*
  (cookies) tabs, and *View Source* (Ctrl+U).
- `curl` in the terminal (great for sending requests by hand).
- Optional: a cookie-editor extension; content-discovery tools like
  `gobuster`/`ffuf` (though everything can be done without them).

## Tracking your flags

Record each flag you find in a `flags.md` file (create your own, using the
format below) and, most importantly, **how** you got it — that's where the
learning is.

| # | Category (light hint)      | Flag found | How I got it |
|---|----------------------------|------------|--------------|
| 1 | Reconnaissance (scripts)   |            |              |
| 2 | File upload                |            |              |
| 3 | File read                  |            |              |
| 4 | Session / cookies          |            |              |
| 5 | Access control (resources) |            |              |
| 6 | Exposed API                |            |              |

## Running it

See [`setup.md`](./setup.md) for a one-command deployment on any Linux server
(local VM or cloud), plus a quick local-dev option.

## Tech stack

Node.js + Express + EJS + Multer. In-memory data; no external services required.

---

*Intentionally vulnerable, for educational use only. Do not host anything real on
the instance and do not use this in production.*

## License

Released under the MIT License. See [`LICENSE`](./LICENSE).
