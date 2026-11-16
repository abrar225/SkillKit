# Anti-AI Slop & Detection-Proofing Reference

This document catalogs the linguistic markers, punctuation habits, and syntactic habits that trigger AI text classifiers and create audience fatigue.

---

## 1. Punctuation Dead Giveaways

### The Em Dash (`—`) Addiction
* **Why AI uses it:** LLMs generate text token-by-token. Em dashes allow the model to insert an explanatory afterthought without planning the beginning and end of the sentence in advance.
* **Why humans don't:** In modern digital communication, keyboards don't even have an em-dash key. Most engineers and writers use commas, parentheses, or separate sentences.
* **Detection Trigger:** A frequency of more than one em dash per 200 words is a major statistical flag in AI detectors.
* **The Rule:** Strictly eliminate all em dashes and en dashes used as punctuation.

### Semicolons and Colons in Conversational Copy
* AI overuses semicolons in social copy to link short thoughts.
* Humans break the sentence with a period or start a new paragraph.

---

## 2. Structural Dead Giveaways

### Symmetrical 3-Part Lists
* AI prompt training reinforces "structured, neat answers," causing models to default to:
  * 3 benefits
  * 3 challenges
  * 3 takeaways
* Human experience is rarely divided into clean groups of three. Sometimes there is only 1 crucial failure point. Sometimes there are 4 distinct quirks. Break symmetry intentionally.

### The Contrastive Formula ("Not only... but also...")
* AI models constantly rely on:
  * *"It is not just about speed, it's about reliability."*
  * *"This is more than a tool; it's a new paradigm."*
  * *"X isn't merely an upgrade—it's a complete revolution."*
* Humans write: *"Speed matters, but reliability is where most setups break."*

### The Empty Summary Conclusion
* AI models always attempt to summarize the entire message in the final paragraph:
  * *"In summary, as AI continues to evolve..."*
  * *"Ultimately, navigating this landscape requires..."*
* Real humans stop writing when the information is finished. End on the last technical point or a concrete takeaway.

---

## 3. The Banned Vocabulary Blacklist

Avoid every word in this list:

```
beacon
boasts
catalyst
crucial
deep dive
delve
demystify
dynamic
elevate
empower
foster
game-changer
groundbreaking
harness
in today's world
intricate
it is worth noting
journey
landscape
masterpiece
navigating
nestled
paramount
pivotal
plethora
realm
revolutionary
seamless
supercharge
tapestry
testament
treasure trove
unleash
unlock
unprecedented
vital
```
