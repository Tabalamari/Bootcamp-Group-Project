# SkillBridge — Video Presentation & Launch Documentation

## Overview

**SkillBridge** is a responsive community platform designed for dual-track bootcamps. It bridges the gap between Software Development and Business Development learners by providing explainable peer matching, mutual project goals, and instant 1-on-1 collaboration.

- **Staging Service URL:** <https://bootcamp-connect-staging.onrender.com/>
- **Tech Stack:** React 19, Vite, Tailwind CSS, Node.js 20+, Express, PostgreSQL (Supabase), Supabase Storage.

---

## 🎬 18-Second Launch Video Presentation

The launch video is designed for fast, high-impact social sharing and demo presentations. It focuses on the working user flow rather than abstract claims.

### Specifications
- **Format:** Landscape (1920×1080), 30 fps
- **Target Duration:** 18.0 seconds
- **Tone:** Polished / Modern Product Launch
- **Audio Bed:** Upbeat corporate groove (`happy-beats-business-moves-vol-12`, 110 BPM)
- **Voiceover:** Kokoro-82M narration (`af_heart`)
- **Sound Design:** Motion-matched interface clicks, card placement sounds, and connection chimes

---

### Storyboard & Scene Breakdown

```
[0.0s – 3.2s] Hook: Cohort Dilemma ➔ [3.2s – 9.0s] Explainable Discovery ➔ [9.0s – 14.2s] 1-on-1 Collaboration ➔ [14.2s – 18.0s] Brand Launch
```

#### Scene 1: The Cohort Dilemma (0.0s – 3.2s)
- **Visual:** Two distinct track badges enter the frame:
  - *Software Dev:* "Needs Market Strategy"
  - *Business Dev:* "Needs Technical Builders"
- **Hook Headline:** "Better ideas start when builders meet founders."
- **Narration:** *"In every bootcamp, builders need market strategy, and founders need builders."*
- **Audio:** High-energy track begins; crisp snap sound when both tracks align.

#### Scene 2: Explainable Discovery (3.2s – 9.0s)
- **Visual:** Discovery dashboard opens with active filter pills:
  - `Course: Software Development` · `Goal: Project Collaboration`
  - Profile card for **Leo Williams** lands (*Node.js*, *Python*, *Sustainability*).
  - The **Explainable Fit Reason** highlights with a subtle glow:
    > *"Different courses, with a shared interest in project collaboration."*
- **Narration:** *"SkillBridge pairs them with explainable fit reasons, not mystery AI scores."*
- **Audio:** Soft card slide and chime on fit-reason lock.

#### Scene 3: Instant 1-on-1 Collaboration (9.0s – 14.2s)
- **Visual:** Smooth transition into the private chat panel with Leo Williams:
  - **Amara Lewis:** *"Hey Leo! Saw your backend background. Want to build a sustainability MVP together?"*
  - **Leo Williams:** *"100%! Let's do it. What stack are you thinking?"*
- **Narration:** *"From discovery to direct chat, cross-track teams form in seconds."*
- **Audio:** Keyboard tick and message sent/received chimes.

#### Scene 4: Launch & Outro (14.2s – 18.0s)
- **Visual:** SkillBridge logo mark animates with glowing halo.
  - Headline: **"Find your kind of ambition."**
  - Subtitle: *"Built for dual-track collaboration."*
- **Audio:** Music swells slightly and resolves with a clean resonant brand chime.

---

## 📢 Ready-to-Post Launch Copy

### X / Twitter
> Most bootcamp projects fall apart because developers need market strategy, and founders need builders to ship.
>
> We built SkillBridge to bridge the gap with explainable peer matching, shared project goals, and instant 1-on-1 collaboration.
>
> Better ideas start with people. Find your kind of ambition. 🚀

### LinkedIn
> Two cohorts learn side by side in every modern tech bootcamp: Software Developers and Business Developers. Yet finding the right collaborator to turn a capstone into a real product usually comes down to pure luck.
>
> We built **SkillBridge** to make peer discovery transparent and explainable:
> ✦ Cross-track matching based on complementary skills  
> ✦ Transparent fit criteria — no mysterious black-box AI scores  
> ✦ Direct 1-on-1 collaboration messaging  
>
> Better ideas start with people. Find your kind of ambition.

### Slack / Discord Community
> Hey everyone! 👋 We just launched **SkillBridge**. If you've ever struggled to find a complementary builder or business partner for your capstone project, this connects developers and business minds with clear fit reasons and instant messaging. Check out the demo video!

---

## 🛠️ Video Generation Tooling

The video composition is implemented with Hyperframes (`hyperframes`).

### Previewing Locally
To launch the interactive real-time browser preview:
```bash
cd brag-output/composition
npx hyperframes preview
```

### Rendering Video
To re-render the composition to MP4:
```bash
cd brag-output/composition
npx hyperframes check
npx hyperframes render --output ../brag.mp4
```

> **Note:** Video binary outputs (`.mp4`), composition caches, and local virtual environments are intentionally excluded from version control via `.gitignore` to keep repository size lean.
