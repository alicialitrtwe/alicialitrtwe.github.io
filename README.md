# Alicia Zeng — personal site

Static hand-written HTML, one stylesheet and one small script. No build
step, no framework.

    index.html                      homepage: who she is now, the opening, Erised, the three areas, the arc, contact
    research.html                   the full inventory, grouped by area, each area opened by what it means to her
    notes.html                      working notes, newest first
    research/cognition.html         redirects to research.html#cognition (the area pages were folded
    research/closed-loop.html       into the inventory on 2026-10-22; the files stay so old links land)
    research/bayesian.html
    research/atoms.html             the NeurIPS 2026 oral (semantic-cortical atoms): short version from the
                                    abstract, the abstract, BibTeX; no figure yet
    research/superpositions.html    the NeurIPS 2025 paper as a short tutorial (facts from thesis chapter 2)
    research/number.html            the time–space–number result, told from the theory of magnitude (CCN 2026 poster page)
    research/dbs.html               the Nature BME aDBS paper, a short introduction (facts and two figures from the CC BY preprint)
    research/stimulation.html       the home-recording DBS study, explained (thesis chapter 3, verbatim)
    research/birdsong.html          the 2017–2019 Penn project, method only; the APS abstract is the published claim
    notes/thesis.html               the thesis introduction and acknowledgments, as a note
    viewer/                         the sparse-concept-atoms brain viewer — an rsync'd copy of a build
                                    that lives on another machine. READ-ONLY here: fix it upstream.
    atlas/                          (not yet present) the NeurIPS 2026 atom atlas, the same way —
                                    a copy of a build from the sparsebrain repo; see "The atom atlas"
    figures/                        real material only. The area clips (`area-*.mp4` + `.jpg` poster),
                                    the birdsong and viewer clips, the NeurIPS talk and eight slides cut
                                    from it (`talk-*`), the NeurIPS poster, Fig. 1 of the Nature BME
                                    paper and Figs. 2 and 6 of its CC BY preprint, thesis Figures
                                    2.2–2.9 and 3.1–3.6, and the two DBS figures derived from her own
                                    recordings (`dbs-ecosystem`, `dbs-kinematics`).
    files/                          the thesis PDF (33 MB)
    sitemap.xml, robots.txt         twelve pages; the viewer is disallowed (thousands of data files)
    styles.css                      everything visual
    site.js                         the clip observer and the paper-page section nav; optional
    styles-dark.css                 the previous design, kept as a record — see below; it is
                                    not a working revert

## Running it

Open `index.html` in a browser and it works. To serve it over `http://` —
worth doing to check it on a phone:

    cd ~/projects/website && python3 -m http.server 8000

Then `http://localhost:8000`, or `http://<your-mac's-LAN-IP>:8000` from a
phone on the same wifi.

## Deploying it

Any static host. Upload the whole directory, keeping `research/` as a
subdirectory — the paper pages link back out with `../`, so the structure has
to survive.

## Design notes

Black, after szymonkaliski.com: the system sans, one text size, bold for
headings, underlined links, gray for metadata, and a `↗` after every link
that leaves the site. The palette is seven tokens at the top of
`styles.css`; the page is committed to dark (`color-scheme: dark`) rather
than following the OS.

There are **no network requests** beyond the site's own files: no web font,
no analytics, no embeds. `site.js` is optional — with it off every clip stays
on its poster and the paper-page nav loses its highlighted section name,
nothing else.

## Who the site is for (2026-10-22)

Investors and collaborators of Erised AI, where Alicia is a co-founder, as
much as readers of the research. So the first screen says what she does now
(`.hero-eyebrow`, `.hero-statement`), a **Now** section on the index names
Erised and links its public site, every nav carries an Erised link, and the
contact line says who should write. Two rules carried over from Erised's own
site: no company numbers anywhere here, and copy that is plain and specific.
The eyebrow, statement, Now paragraphs, notes intro and contact line are the
site's prose that is not hers; everything else that reads as her voice is
verbatim.

`styles-dark.css` is the previous design, kept as a record. It is **not** a
working revert any more: it styles the markup this site had before the area
cards, the inventory's `outputs--media` list and the page grid, so pointing a
page's `<link rel="stylesheet">` at it now would leave most of that page
unstyled. Read it for what a rule used to be; do not swap it in.

### Animation versus real figures

The rule that decides where each kind of image goes:

- **Decorative, abstract animation** is no longer anywhere on the site. The
  homepage hero held a Lorenz attractor drawn by `site.js` until 2026-10-22;
  it was replaced by her own birdsong animation, which is the same picture
  drawn from real data (see "The hero").
- **Anything from the work itself** — a figure, a poster, a video — goes in
  the same thumbnail slot on the cards and, with a caption, on the paper
  page. It always wins over the decoration: when a real image exists, the
  abstract one goes.

Every media slot on the site now holds real material, so the abstract `.viz`
stand-ins and the `.fig-slot` placeholder box have been deleted from
`styles.css`.

### The hero

`<figure class="hero-media">` in the opening of `index.html`: her own 2018
animation of one zebra finch song reconstructed as a trajectory in state
space (`figures/project-birdsong.mp4`, the same clip the inventory uses as
the birdsong thumbnail), captioned, in the clips' shared 1.45 frame. It is
real material, so it follows the figure rule above rather than the decoration
rule. `site.js` starts it when on screen like every other clip. Above the text
sit two lines that are not hers: a mono eyebrow with the affiliation and a
one-sentence statement of what she does now.

### The area cards

The homepage does not list papers. It carries three `<article class="area">`
cards — Cognition, Closed loop, Bayesian, in that order — each a clip beside
a title, a one-line lead and the names of what is inside it. The card's whole
surface is the link (the title's `::after` covers it), so anything else
clickable in there needs its own stacking context; `.area-extra` is the one
that does.

    <article class="area" data-area="cognition">      <- sets --area for the card
      <div class="area-media">
        <video loop muted playsinline preload="none"
               poster="figures/area-cognition.jpg" width="1270" height="810"
               aria-label="…">
          <source src="figures/area-cognition.mp4" type="video/mp4">
        </video>
      </div>
      <div class="area-body">
        <h3 class="area-title"><a href="research/cognition.html">Cognition</a></h3>
        <p class="area-lead">…</p>
        <p class="area-count">Number, space and time · Birdsong in state space</p>
      </div>
    </article>

No `autoplay` attribute and `preload="none"`: `site.js` starts a clip when it
scrolls into view and pauses it when it leaves, which is the difference
between a homepage that fetches 4.9 MB before a scroll and one that fetches
its posters. With no script each clip stays on its poster, which is a real
frame of the thing it shows.

Every clip box is `aspect-ratio: 1.45` with `object-fit: contain`, so frames
line up down the page and across to the inventory's thumbnails. Render a new
clip at 870×600 and it will fill its frame exactly. The one exception is
`.project-media--wide`, 16:9, for the conference talk — a recording of a room
rather than one of the data clips.

The full inventory lives on `research.html`; the index cards link to its
sections, so an entry is written exactly once.

### Paper pages

Each paper page is the Nerfies / Waller-lab shape: centred title, authors,
venue, a row of pill buttons, a sticky section list, one teaser figure,
then Abstract, Summary, one section per idea, BibTeX. `site.js` underlines
the section you are in.

To add a section: duplicate one `<section class="paper-section">`, give it a
new `id`, and add a matching `<li>` to the `paper-nav` list. Anchors clear the
sticky nav: `html { scroll-padding-top }` steps with the nav's height as it
wraps. A figure in a section is a `figure.fig` with the media and a caption
(every figure on the site is real material):

```html
<figure class="fig">
  <img src="../figures/dbs-decoder.png" alt="…" width="…" height="…">
  <!-- or -->
  <video src="../figures/dbs-decoder.mp4" autoplay loop muted playsinline></video>
  <!-- or, for a hosted video that allows embedding -->
  <iframe src="https://www.youtube.com/embed/…" title="…" allowfullscreen></iframe>
  <figcaption>What the reader should see in it.</figcaption>
</figure>
```

Where a paper's own abstract appears it is verbatim, and it appears once: in
an Abstract section on the paper page. The homepage and the inventory carry a
one-line lead written for them instead, so there is no second copy to keep in
step.

### The atom atlas (the NeurIPS 2026 viewer)

The viewer for the semantic-cortical atoms paper is built by the private
`alicialitrtwe/sparsebrain` repo: `scripts/50_build_atom_viewer.py` writes a
static pycortex site (`index.html` atlas, `viewer.html`, `about.html`, packed
volume PNGs under `data/`, `thumbs/`, `atoms.json`, a `.nojekyll`), and
`scripts/51_build_story_player.py` adds `story.html` with `story/*.bin` and an
MP3 of the story. Its design notes are `reports/atom_viewer_design.md` and
`reports/story_player_design.md` there. The build is not committed anywhere
(`outputs/atom_viewer/<name>/`, ~100 MB plus the story player), so it travels
to this site the way `viewer/` does: as a copied build, read-only here.

To serve it from this site, at `https://alicialitrtwe.github.io/atlas/`:

1. Build it on the machine that has the checkpoint, with the site URL it will
   live at, so any absolute link it writes is right:

       uv run python scripts/50_build_atom_viewer.py --site_url https://alicialitrtwe.github.io/atlas/
       uv run python scripts/51_build_story_player.py   # same out_dir

   Do not run `scripts/experiments/add_site_banner.py` on it: that bar is for
   builds of a model other than the published one.
2. Copy the build in, keeping the `.nojekyll` (Jekyll would drop the
   `data/__*.png` files without it):

       rsync -az --delete <machine>:<path to the build>/ ./atlas/

3. Check it before pushing: no single file over 100 MB (GitHub's hard limit;
   `find atlas -size +95M`), the whole repository well under 1 GB
   (`du -sh .git atlas viewer figures files`), and `atlas/index.html`,
   `atlas/viewer.html#atom=1` and `atlas/story.html` opening from
   `python3 -m http.server`. The story's audio needs HTTP Range to scrub;
   Pages serves 206 responses (checked against `viewer/` on 2026-10-22), so a
   local run that cannot scrub is the local server, not the build (use the
   repo's `scripts/serve_viewer.py` to preview).
4. Then link it, in the same commit as the copy and never before: an "Atom
   atlas" button on `research/atoms.html` (`id="l-atlas"`, like the viewer
   button on `number.html`), an "Atom atlas" link in the paper's
   `.output-links` row on `research.html`, and "Play with it yourself" as an
   `.area-extra` on the index's Bayesian card if you want it there. Pushing
   master deploys it; `robots.txt` already disallows `/atlas/`, as it does
   `/viewer/`.

### Explainer pages

`research/superpositions.html`, `research/number.html`,
`research/stimulation.html` and `research/dbs.html` are explainers in the
shape of John Hewitt's structural-probe page and the Waller lab's
EncodingInformation site: title, buttons, hero figure, one pulled sentence,
then the work told in sections with the figures interleaved. They differ in
who wrote the words and in how much they say.

**Superpositions is a short tutorial.** Its running text was written for the
page (plain language, no equations beyond a boxed "for the algebra-inclined"
note), so it is *not* thesis text and can be edited freely; what must not
drift are the facts. Every number on it — 300 → 1,000 atoms, the 0.03 % vs
2.18 % cosine overlap, ΔR² = 0.00047 ± 0.00071 with t(6) = −1.77, p = 0.13,
inter-subject map consistency 0.26 ± 0.04 vs 0.09 ± 0.04, the top-5,000-voxel
overlaps (IoU 0.32–0.34 pairwise, 0.18 three-way), the 0.70 ± 0.08
cross-subject similarity, |r| = 0.00 ± 0.10 vs 0.16 ± 0.14 — and every word
list in the eight-row atom table comes from chapter 2 of the thesis (Table 2.1
for the word lists). The Abstract section is the paper's abstract verbatim and
must match the research card. Stat tiles use `ul.stats`, the boxed note
`.box` + `.box-label`, the opening paragraph `p.tldr`.

**Number is a tutorial too.** `research/number.html` is the page for the CCN
2026 poster ("A Distributed Cortical Network Integrates Semantic
Representations of Number, Space, and Time", Hendrikx, Zeng, Yashaswini,
Visconti di Oleggio Castello, Gallant). It opens from Walsh's theory of
magnitude (2003), Dehaene (1997) and Dehaene & Brannon (2010), then tells the
time–space–number case study of thesis chapter 2 (Section 2.6.5): atoms 505 /
81 / 997, top-5,000-voxel composite maps, IoU 0.34 / 0.32 / 0.32 pairwise and
0.18 three-way, the within-domain atom-pair map similarities from the
supplement (0.50, 0.50, 0.43–0.46 vs 0.05 across domains), and the 798–81–505
branch of the Figure 2.7 dendrogram. Figures: 2.6 (hero), 2.1, 2.9 (the
dense-model control, newly exported to `figures/thesis-fig2-9.jpg`) and 2.7.
The poster's abstract is on the page verbatim from the CCN 2026 site
(`https://2026.ccneuro.org/poster/?id=V6IilrmWYe` — the conference's own
listing; OpenReview blocks fetching but the CCN page links its PDF), with a
source line giving the session (C46, Session C, Wednesday 5 August). Note the
abstract describes a 19-participant analysis and a tuning continuum, while the
page's figures and numbers are the seven-listener thesis case study — the
source line says so explicitly. No poster file or video is published anywhere
(CCN 2026 hosts neither, and there is no NeurIPS entry for it), so the "CCN
poster" button stays a stub; on her pointer to neurips.cc/virtual/2025/poster/120024
the page instead carries a Poster section with the NeurIPS 2025 poster of the
method paper (same `figures/superpositions-poster.png`, whose time/space/number
panel is this analysis) and a Video button to its SlidesLive talk. On the
inventory it is the first entry of the Cognition group, above the brain viewer
and the birdsong abstract, thumbnailed with the flatmap channel clip; CCN and
OpenReview links live on the page itself.

**DBS is a short introduction, not a tutorial.** You are the third of eleven
authors on the Nature BME paper, so `research/dbs.html` describes the study
rather than narrating it as "we", in the register of the thesis introduction
(measured, systems-minded, no jokes — she asked for exactly that; on
2026-09-04 the same register was applied, lightly, to the prose of the
superpositions and number pages, with every number and all verbatim blocks
unchanged): five short
sections (short version, closing the loop, optimized at home, the blinded
comparison, my part), the last one stating your
contribution from the paper's author-contribution statement (designed the
data-collection infrastructure with G.S., T.F. and R.B.; analysed the data
with T.C.D., G.S. and R.B.), linking the JoVE platform paper and thesis
chapter 3. The published article is not open access, so every number on the
page — 6 home sessions of ~25 min, 682 candidate models, personalized bands
+6 % / +3 %, held-out 83 % / 76 %, 12 blinded sessions over 154 days with the
last 435 days after training, 82 % / 76 % online, 1.6 / 1.9 / 2.2 mA,
r = 0.52 and −0.44, 0.33 keypresses/s — and the pull quote come from the
CC BY 4.0 medRxiv preprint (10.1101/2024.08.14.24312002), and its Figures 2
and 6 are on the page as `figures/dbs-preprint-fig2.jpg` and
`dbs-preprint-fig6.jpg`, credited in their captions. If the published
version's numbers differ, the preprint's stand until you change them. The
hero is still the publisher's Fig. 1; its long legend is kept verbatim inside
a folded `<details class="legend">` under a one-line caption of mine.

**Stimulation is verbatim.** Every sentence of its body text is thesis
chapter 3, from the PDF; the only words that are not hers are the short
`.source` line under the pull quote, the image `alt` texts and the BibTeX
`note`. Equations are hand-transcribed into MathML from the rendered PDF
pages (check the ridge objective and the pose `cos θ` formula against the
PDF). It was generated, not hand-written: the builders live outside the repo
in the session scratchpad (`build/lib.py`, `build_stim.py` alongside the
extracted `thesis/text.txt`), so edit the HTML directly; if you ever need to
regenerate, the recipe is: extract the PDF text with the PDFKit script,
choose paragraph line ranges, and let the library strip page headers, rejoin
hyphenated line breaks and fix the PDF's spacing artifacts. Hyphenation at
line breaks was decided word by word ("counterbalanced",
"electrophysiological" joined; "multi-output", "leave-one-day-out",
"keystroke-based" kept).

**Superpositions** has its real material: the hero is thesis Figure 2.1,
the poster sits in its own section
(`figures/superpositions-poster.png`, 2592 × 1296, from neurips.cc, served
through `<picture>` as `superpositions-poster.webp` — cwebp q88, 0.6 MB
instead of 1.5 — with the PNG as fallback and "Full size" link), and the
buttons link to OpenReview, the NeurIPS page, the poster, the SlidesLive
video, the code (the GitHub URL from the thesis footnote) and the thesis.
SlidesLive refuses to be embedded anywhere but neurips.cc ("Domain not
allowed"), so the talk is served here as her own recording
(`figures/talk-superpositions.mp4`) with a transcript folded under it, and
SlidesLive is a link. Eight slides cut from that recording (`figures/talk-*`)
carry the page's argument; the thesis figures that remain are in
`figures/thesis-fig2-*`. The inventory thumbnail is the flatmap clip the
models are fit to (`figures/area-bayesian.mp4`).

**Stimulation** (chapter 3, "Deep Brain Stimulation Amplifies
Movement-Related Neural Modulation in Parkinson's Disease") carries Figures
3.1–3.6 (`figures/thesis-fig3-*.jpg`, exported at 1600 px from the PDF at
3× and cropped to the plot). Its buttons go to the thesis PDF, the thesis
page and the Nature BME paper page. Section 3.4.4's packet-merging detail and
the supplementary patient instructions are left to the PDF. The chapter is not
in the inventory at all — it is reached from `research/dbs.html`, which links it as the
related chapter.

**DBS** has Fig. 1 of the paper as its teaser (`figures/dbs-fig1.png`, from
the publisher's figure page, legend verbatim but folded) and a crop of it as
the card thumbnail. The article itself is not open access; the figure is here
on the strength of your being an author — your call whether that is fine. The
two body figures are from the CC BY preprint and need no permission.

**Thesis** is built entirely from the PDF (`files/Thesis-Alicia_Zeng.pdf`):
the abstract, the introduction (chapter 1, split into Introduction /
Chapter 2 / Chapter 3 / Summary and Motivation), the acknowledgments and
the dedication, all verbatim, with Figures 3.1 (teaser), 2.1 and 3.6 and
their captions. The card thumbnail is the spectrogram block of Figure 3.1.
Each chapter section ends with a link to its explainer page, and the
buttons include "Chapter 2 as a paper" and "Chapter 3 in full".

Motion respects `prefers-reduced-motion`. There is no scroll-driven reveal.

## Links that are already real

Verified against Crossref, PubMed and the NeurIPS site — not typed from
memory:

| work | link |
|---|---|
| Learning Sparse Semantic-Cortical Atoms (NeurIPS 2026 oral) | OpenReview `YcEZoSqrxa`, `neurips.cc/virtual/2026/loc/sydney/oral/151713` (lists one author; abstract taken from there) |
| Disentangling superpositions | OpenReview `3aNvX9TQTo`, NeurIPS 2025 poster page, poster PNG, SlidesLive `39050668` |
| Movement-responsive DBS | `10.1038/s41551-025-01438-0`, PubMed 40579487 |
| Bringing the Clinic Home | `10.3791/65305` (J. Vis. Exp., 2023) |
| In-Home Video and IMU Kinematics | `10.36227/techrxiv.22067474` (preprint, 2023) |
| A Distributed Cortical Network Integrates … Number, Space, and Time | OpenReview `V6IilrmWYe` (CCN 2026 poster) |
| A Nonlinear Dynamical System Approach to Bird Song Analysis | ADS `2019APS..MARL70298Z`, plus the *Song Attractor* video on YouTube |

The OpenReview and ADS entries were checked by you, not by a script — those
two sites block automated access.

### Titles and author lists

Titles are the published ones. Every entry carries its full author list in
published order (`<p class="authors">`), with you marked
`<span class="me">…</span>`. You publish under two names: **Alicia Zeng**
everywhere, and **Xiao Zeng** on the 2019 APS abstract — the markup uses
whichever the venue printed.

On the homepage the three cards show only a title and a one-line lead; the
author lists are on `research.html` and on each paper page.

### Research groups

`research.html` is three groups in your order — **Cognition**
(number/space/time, the brain viewer, birdsong), **Closed loop**
(movement-responsive DBS, Bringing the Clinic Home, In-Home Video and IMU
Kinematics) and **Bayesian** (the NeurIPS 2026 oral on semantic-cortical
atoms, then sparse concept atoms). Each group is a
`<section class="block group" id="…" data-area="…">` that opens with a
`.group-intro` (the standfirst and the two paragraphs that used to open the
area page, saying what the area means to you) and then holds a
`<ul class="outputs outputs--media">`; move an entry by moving its `<li>`,
move a whole area by moving its section. `index.html` carries the same order
and its cards link to these sections.

The three area pages under `research/` are redirects to those sections now
(kept so old links land; `noindex`, and out of the sitemap). The NeurIPS talk
that lived on the Bayesian page is a section of `research/superpositions.html`
(`#talk`), with its transcript.

`data-area` is what sets `--area`, the one slot the three hues fill, so the
colour follows an entry from the homepage through to its own page. A page that
belongs to no single area — the homepage, the inventory, the notes, the thesis
— has no `data-area`, and its title mark is a gradient across all three rather
than one area's colour.

The thesis is **not** listed as research. It is a note (`notes/thesis.html`),
and so are its chapters: chapter 3, the unpublished stimulation study, lives at
`research/stimulation.html` and is reached from `research/dbs.html` as the related
chapter, not from the inventory.

### The arc

The "2017 to now" section on the homepage is one sentence per beat — the
first sentence of each beat from your draft, nothing added except the
stimulus facts filled into the 2020–2025 sentence (two hours of Moth Radio
Hour stories, from the superpositions page) and a link from "characterization
instruments" to the Now section. The rest of the draft's beat prose is not on
the page; the draft is the place to recover it.

## Placeholders

There are none left (2026-10-22): every `class="todo"` was filled or removed,
and the `.todo` / `.fig-slot` / `.button.todo` rules went with them. Things
that were dropped rather than filled, in case you want them back: the Google
Scholar and ORCID chips in the contact section (no public profile was found;
add the links as plain `<a>`s in `.profiles`), the Code button on
`research/dbs.html` (no public repository), the poster button on
`research/number.html` (CCN publishes none), the unnamed second Bayesian
project, the two "Explainer" chips (the per-paper lay explainers are still
unwritten; add a chip back when one exists), and the two sample notes.

If you add a placeholder again, mark it `class="todo"` so it is greppable, and
bring back the `.todo` rule from git history (`git show c04303b:styles.css`).

### Adding a publication

Copy an existing `<li>` inside the right group's
`<ul class="outputs outputs--media">` in `research.html`. An entry is a thumbnail
(`.output-media`) beside a body: the title with its venue in
`<span class="pub-meta">`, the full author list in published order with you
marked `<span class="me">…</span>`, and a row of `.output-links`.

If it needs a page of its own, copy one under `research/`, keeping the section
ids and the `paper-nav` list in step. On a paper page the buttons are named by
`aria-labelledby="<link-id> <heading-id>"`, so a screen reader reads
"PDF, *title*" without the title being stored twice.

A co-authored paper, preprint or talk that does not need its own page is the
same `<li>` with its links going straight out — there is no separate minor
list any more. Give it a thumbnail from its own material.

### Adding a note

Copy an `<li class="note-item">` to the **top** of `<ol class="stream">` in
`notes.html` and set both the `datetime` attribute and the visible date.
