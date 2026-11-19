# Alicia Zeng: personal site

Hand-written static HTML, one stylesheet (`styles.css`), one shared script
(`site.js`) and three small page scripts under `viz/`. No build step, no
framework, no requests to any host but the site itself. Served by GitHub Pages
from the default branch (`master`) of `alicialitrtwe/alicialitrtwe.github.io`;
pushing to `master` deploys.

Readers are investors and research collaborators of Erised AI, where the owner
is co-founder and CTO, as much as specialists. Most are not from her field.

## Files

    index.html                      homepage (order below)
    research.html                   every paper, talk and tool, in three groups
    notes.html                      working notes, newest first (one so far)
    notes/thesis.html               the thesis introduction and acknowledgments, as a note
    404.html                        not-found page; absolute paths, no site.js, not in the sitemap
    research/components.html        NeurIPS 2026 oral, semantic-cortical components (viz/components.js)
    research/superpositions.html    NeurIPS 2025, sparse concept atoms (viz/superpositions.js)
    research/number.html            CCN 2026 poster, number, space and time
    research/dbs.html               Nature Biomedical Engineering 2026, movement-responsive DBS (viz/dbs.js)
    research/stimulation.html       thesis chapter 3, unpublished; reached from dbs.html only
    research/birdsong.html          2017–2019 Penn project; the APS abstract is its only published claim
    research/atoms.html             redirect -> components.html (the paper's old "atoms" title)
    research/jointsae.html          redirect -> components.html#components (the camera-ready
                                    prints this address for its "interactive viewer" of the 50)
    research/bayesian.html          redirects -> research.html#bayesian, #cognition, #closed-loop
    research/cognition.html         (the area pages folded into research.html on 2026-10-22)
    research/closed-loop.html
    viz/                            one script per page that needs one; loaded only by that page
    viewer/                         the CCN 2026 brain viewer, a copied build. READ-ONLY: fix upstream
    figures/                        every image and clip (families below)
    files/                          the thesis PDF (33 MB) and the NeurIPS 2026 manuscript as
                                    submitted (unlinked)
    sitemap.xml, robots.txt         the ten real pages; redirects, 404, viewer/ and atlas/ left out
    styles-dark.css                 an earlier design, kept as a record; not a working revert

Every redirect page carries `noindex` and a canonical link to its target. The
anchors `#bayesian`, `#cognition` and `#closed-loop` and the `data-area`
values keep the areas' old names; the visible names are Interpretable models,
Dense measurement and Closed-loop instruments.

## The owner's direction (2026-11-19)

- Research pages are short, intuitive introductions, not a repeat of the
  paper: a one-sentence takeaway, the question, the obstacle, the idea, two to
  four findings each with one visual, why it matters, then a pointer to the
  paper. Leave out statistics and test results, hyperparameters, procedures and
  caveat lists. At most three headline numbers per page, each one a lay reader
  understands and each checked against the source.
- Visuals come from the publication (crops credited in the caption), from
  public data already on disk (the viewer), or are coded illustrations, which
  are labelled as illustrations and never look like measured data.
- Where sources disagree on a number, the camera-ready paper wins.
- Plain prose, American spelling, no AI-sounding constructions (no "not X but
  Y", no rhetorical questions, no intensifiers, no em dashes as pauses). First
  person where the owner did the work; the DBS paper, where she is third of
  eleven authors, is described from outside with her part stated plainly.
- No startup numbers (funding, customers, headcount) anywhere.
- Dark only; colours from the tokens at the top of `styles.css`; text
  contrast at least 4.5:1; colour never the only signal. Complete without
  JavaScript; all motion stops under `prefers-reduced-motion`.

## What is verbatim (do not edit)

- Every paper abstract, in the Abstract section of its page.
- Every BibTeX block (`pre.bibtex`).
- The talk transcript on `superpositions.html` (`details.transcript`).
- The published legend of Fig. 1 on `dbs.html` (`details.legend`).
- The owner's essay on `index.html`: the `.lead` and `.prose` in
  `section.essay` (shown as "Background"). Written with her and approved
  sentence by sentence; lightly edited for plain language on 2026-11-17 at her
  request. Do not smooth it further without her.
- The body of `notes/thesis.html`, adapted from the thesis introduction and
  acknowledgments. It still prints "behaviour" twice; the thesis PDF prints
  "behavior", but neither sentence appears in the PDF word for word, so the
  spelling was left for her to decide.

Everything else is written for the site and may be edited, as long as the
facts below do not drift.

## Facts that must not drift

**NeurIPS 2026 oral** (`components.html`). *Semantic-Cortical Components: A
Multisubject Coupled Sparse Autoencoder for Interpretable Language Encoding in
fMRI*, the owner alone; Sydney. Source of truth: the camera-ready
`paper/neurips_2026/neurips_2026.tex` in the private `sparsebrain` repo. The
unit is a **component** (submitted as "atoms"; the conference listing may still
show the old title). 50 components, five active per time point, six training
listeners (UTS01–06), Gemma-2-2b activations of 2,304 dimensions. About 82% of
the matched ridge model's brain prediction (20 seeds). For two new listeners a
readout from the frozen code recovers 87% and 102% of ridge with about 2% of
its parameters. Five components track speech timing. The brain-first two-stage
model predicts the brain slightly *better* than the jointly trained one; never
say joint training is needed for brain prediction, and never claim accuracy
superiority over a dense model. The list of 50 and Table 15 are generated from
the tex (`<!-- cx rows -->`, `<!-- tab:catalog rows -->`).

**NeurIPS 2025** (`superpositions.html`). *Disentangling Superpositions:
Interpretable Brain Encoding Model with Sparse Concept Atoms*, Zeng and
Gallant. The unit is a **concept atom**: 1,000 atoms learned by sparse coding
from GloVe. Seven listeners of The Moth Radio Hour stories (Huth et al. 2016).
Prediction matches the dense model (no measurable difference). Number, time
and space atoms overlap in the intraparietal sulcus and inferior frontal gyrus
of both hemispheres. Source: thesis chapter 2.

**CCN 2026 poster** (`number.html`). Hendrikx, Zeng, Yashaswini, Visconti di
Oleggio Castello, Gallant; poster C46. The 19-listener network and tuning
continuum are from the abstract; the seven-listener overlap is thesis section
2.6.5. The brain viewer shows the 19-listener group map and three individuals.

**Nature Biomedical Engineering 2026** (`dbs.html`). Dixon et al., eleven
authors, the owner third. One participant; a decoder tuned from home
recordings; blinded comparison against an inverted control and constant
stimulation. Results sentences follow the abstract; the two body figures are
from the CC BY 4.0 medRxiv preprint (10.1101/2024.08.14.24312002); Fig. 1 is
the publisher's.

**Thesis chapter 3** (`stimulation.html`). Unpublished. Two participants, six
home recording days each, three stimulation levels; the stimulation effect was
clear in one participant only. Source: the thesis PDF.

**Birdsong** (`birdsong.html`). APS March Meeting 2019 abstract, published
under Xiao Zeng, with Eve Armstrong and Vijay Balasubramanian. The page
describes the method only; its figure is a coded Lorenz illustration. The page leads with her own attractor clip (`figures/project-birdsong.*`), restored on 2026-11-19 at her request after a rewrite had reduced it to a link; the coded delay-embedding illustration sits lower, in "The approach".

Venue labels used everywhere: "NeurIPS 2026, oral", "NeurIPS 2025", "CCN 2026,
poster", "Nature Biomedical Engineering 2026", "Thesis, chapter 3". Contact
address: alicia@erised-ai.com.

## The homepage, top to bottom

1. Hero: eyebrow (role, PhD), the one-line statement, the line of venues (each
   a link to its page), then the brain viewer's group map turning
   (`home-hero.mp4`) with a colour key and the button into the viewer.
2. Now: Erised AI, from its public description.
3. Research: three area cards (Interpretable models, Dense measurement,
   Closed-loop instruments), each a clip or image, a one-line lead and one row
   per work with its venue. The card's surface is the title's link.
4. Background: the essay, verbatim.
5. Contact: who should write, the address, profiles, one line about life
   outside work.

`research.html` has the same three groups in the same order, each opened by a
short introduction and followed by its entries (thumbnail, title and venue,
authors, links).

## Figures

Real material is credited in its caption; coded illustrations say so. Families
in use:

- `home-*`: homepage media. `home-hero` (viewer capture, group map),
  `home-components` (four components cut from Fig. 2 of the 2026 paper; also
  on research.html), `home-dense` (the viewer's channel toggles, labelled).
- `thumb-*`: research.html thumbnails. `thumb-superpositions` (a slide of the
  2025 talk), `thumb-viewer` (clip), `thumb-dbs` (preprint Fig. 2b, light and
  dark swapped, also on the index), `thumb-jove` and `thumb-kinematics` (drawn
  illustrations; the charts they replaced used unpublished recordings).
- `components-*`: Fig. 1 and Fig. 2 of the camera-ready, the per-component map
  tiles (`components-c<N>-uts02|uts03|uts06|avg.jpg`, cut from Fig. 2 and the
  appendix example figures), `components-og.jpg`.
- `sp-*`: `sp-family-maps.jpg`, a crop of thesis Figure 2.5.
- `num-*`: `num-group-map.jpg`, the viewer's group map on a darker ground.
- `dbs-*`: `dbs-fig1.png` (published Fig. 1), `dbs-threshold.png` (its panels
  a and b), `dbs-home-signal.jpg` and `dbs-results.jpg` (preprint Figs. 2b and
  6a/e).
- `stim-*`: crops of thesis Figures 3.1, 3.3, 3.4 and 3.6.
- `talk-*`: the 2025 talk (`talk-superpositions.mp4`, the only clip with sound,
  with controls and a transcript) and slides cut from it (`talk-overlap`,
  `talk-weights`).
- `superpositions-poster.*`, `project-birdsong.*` (the 2018 attractor clip).

No longer referenced by any page, kept on disk: `area-*`, `viewer-thumb.*`,
`number-viewer-tour.*`, `atoms-fig1.*`, `components-thumb.*`,
`components-fig2.webp`, `dbs-preprint-fig2/6.jpg`, `talk-*` slides other than
the two above, `thesis-fig2-*`, `thesis-fig3-*`, `dbs-ecosystem.jpg`,
`dbs-kinematics.jpg`. Files on disk are still public once pushed:
`dbs-ecosystem.jpg`, `dbs-kinematics.jpg` and `area-closed-loop.*` were made
from unpublished recordings and should be deleted before the next deploy if the
owner agrees.

Clip conventions: `loop muted playsinline preload="none"`, a poster, `width`
and `height`, an `aria-label`; no `autoplay`. `site.js` starts a clip when it
is on screen and never under reduced motion. Media slots are 870 by 600 (the
1.45 frame); the hero is 1160 by 580. A poster should be the clip's first
frame; if it is not, add the frame time to `POSTER_AT` in `site.js` or put
`data-poster-at` on the video (only `project-birdsong` needs one now).

## CSS and JS

`styles.css` is one file in layers: tokens and base at the top, then the
site's earlier passes (sections headed `/* ---- … ---- */`, including the two
design passes of 2026-11-17), then one block per later pass, each opened by
`/* ==== agent:<name> ==== */`:

- `homepage` (hero, Now, cards with work rows, Contact), `viz` (charts and the
  component list base), `reading` (figure zoom, BibTeX copy, progress line,
  back-to-top, long-form type), `motion` (entrances, hover and press states,
  page cross-fade), `components`, `lang` (superpositions and number),
  `clinical` (dbs, stimulation, birdsong), `media` (hero and card media).

Each block uses its own class prefixes (`cs-`, `cx-`, `il-`, `cmp-`, `sp-`,
`num-`, `dbs-`, `bird-`, `rd-`, `m-`). Later blocks override earlier ones; add
new rules in a new block at the end rather than editing inside an old one.

`site.js` has three closures: the core (clip playback; the sticky section
list marks the section in view), `agent:reading` (runs only on pages with
`article.paper`) and `agent:motion` (poster-frame starts; entrances that hide
nothing until the reader scrolls, never on a jump, a hash, print or reduced
motion). A figure with its own interaction carries `data-no-zoom`. Page
scripts in `viz/` are self-contained: `components.js` (the component
switchers, deep links such as `#comp-c24`, the folding list of 50),
`superpositions.js` (the superposition illustration's buttons), `dbs.js` (the
loop illustration's playhead).

## Adding things

- **A page.** Copy the closest page under `research/`. Keep `article.paper`,
  `.paper-head` (buttons named by `aria-labelledby="<link-id> paper"`),
  `.paper-nav` with one `<a href="#id">` per `section.paper-section[id]`,
  `figure.fig` with `figcaption` (`fig--plate` for a white-ground figure). Add
  it to `sitemap.xml`, link it from `research.html` and, if it belongs there,
  from an index card.
- **A figure.** Put the file in `figures/`, give the `img` `width`, `height`,
  accurate `alt` and `loading="lazy"` below the fold, and a caption that says
  what to look at and where it came from.
- **A publication.** Copy an `<li>` in the right group of `research.html`:
  thumbnail, title with venue in `.pub-meta`, the full author list in
  published order with the owner in `<span class="me">`, and `.output-links`.
- **A note.** Copy an `<li class="note-item">` to the top of the list in
  `notes.html` and set both the `datetime` and the visible date.

After any change, check every internal link and `#fragment` resolves (the
QA script that did this is not in the repo; a 40-line HTML parser does it).

## Running it

    python3 -m http.server 8000

then `http://localhost:8000`. Python's server does not answer Range
requests, so clips start from their first frame there; on Pages they start on
their poster frame.

## The atom atlas (not yet present)

`robots.txt` reserves `/atlas/` for a viewer of the NeurIPS 2026 components,
built by `scripts/50_build_atom_viewer.py` and `51_build_story_player.py` in
the `sparsebrain` repo (`--site_url https://alicialitrtwe.github.io/atlas/`),
copied in like `viewer/` with its `.nojekyll`. Keep every file under 100 MB.
Until it exists, `research/jointsae.html` sends the paper's printed address to
the list of 50 on `components.html`.

## Links verified

Titles, venues, years and DOIs were checked against Crossref, PubMed and the
conference sites (OpenReview and ADS by hand). Each external URL is entered
once on its paper page and copied from there.

| work | link |
|---|---|
| Semantic-Cortical Components (NeurIPS 2026 oral) | OpenReview `YcEZoSqrxa`, `neurips.cc/virtual/2026/loc/sydney/oral/151713` |
| Disentangling Superpositions (NeurIPS 2025) | OpenReview `3aNvX9TQTo`, NeurIPS poster 120024, SlidesLive `39050668` |
| Movement-responsive DBS | `10.1038/s41551-025-01438-0`, PubMed 40579487 |
| Bringing the Clinic Home | `10.3791/65305` (J. Vis. Exp., 2023) |
| In-Home Video and IMU Kinematics | `10.36227/techrxiv.22067474` (preprint, 2023) |
| Number, Space, and Time (CCN 2026) | OpenReview `V6IilrmWYe`, `2026.ccneuro.org/poster/?id=V6IilrmWYe` |
| Bird Song Analysis (APS 2019) | ADS `2019APS..MARL70298Z`, Song Attractor video on YouTube |
