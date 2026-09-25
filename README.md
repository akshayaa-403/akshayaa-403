## Akshayaa Kashyap

<div align="center">
<samp>AI engineer · India</samp><br>
<samp><a href="https://akshayaa-403.github.io/portfolio/">portfolio</a> · <a href="https://linkedin.com/in/akshayaa-kashyap">linkedin</a> · <a href="https://akshayaakashyap.substack.com">substack</a> · <a href="https://akshayaa-403.github.io/portfolio/public/assets/resume.pdf">résumé</a> · akshayaakashyap5@gmail.com</samp>
</div>

<br>

I build the part between a messy source and a decision someone has to make. Three of those, each drawn from its own data:

<table>
<tr>
<td width="33%" valign="top">
<a href="https://github.com/akshayaa-403/phase-contrast-denoising"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/figures/halo-dark.svg"><img src="assets/figures/halo-light.svg" width="100%" alt="Nine cell outlines traced from a phase-contrast sample frame, first with a bright halo ring around each, then without it."></picture></a>
<br><b>Phase-contrast clean-up</b><br>
DoG and CLAHE, then an optional residual U-Net. PSNR 12.87 → 20.62 dB over six synthetic samples.<br>
<a href="https://github.com/akshayaa-403/phase-contrast-denoising">code</a> · <a href="https://akshayaa-403.github.io/portfolio/work/phase-contrast-denoising.html">case study</a>
</td>
<td width="33%" valign="top">
<a href="https://github.com/akshayaa-403/quantamental-screener"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/figures/backtest-dark.svg"><img src="assets/figures/backtest-light.svg" width="100%" alt="Equity curves of the screen and the S&amp;P 500 over the backtest. The screen ends at +19.70%, the index at +21.99%."></picture></a>
<br><b>Quantamental Screener</b><br>
Momentum, sentiment, volume and volatility, z-scored and blended. It lost to the index, at Sharpe 1.20.<br>
<a href="https://quantamental-screener.streamlit.app">app</a> · <a href="https://github.com/akshayaa-403/quantamental-screener">code</a> · <a href="https://akshayaa-403.github.io/portfolio/work/quantamental-screener.html">case study</a>
</td>
<td width="33%" valign="top">
<a href="https://github.com/akshayaa-403/Wikipedia-Summarizer"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/figures/rouge-dark.svg"><img src="assets/figures/rouge-light.svg" width="100%" alt="ROUGE-1 of four extractive summarisers on three articles, with the human ceiling dashed. MMR wins two, TextRank one."></picture></a>
<br><b>Wikipedia Summarizer</b><br>
Four summarisers against the humans who wrote the lead. The winner changes with the article.<br>
<a href="https://akshayaa-403.github.io/Wikipedia-Summarizer/">demo</a> · <a href="https://github.com/akshayaa-403/Wikipedia-Summarizer">code</a> · <a href="https://akshayaa-403.github.io/portfolio/work/wikipedia-summarizer.html">case study</a>
</td>
</tr>
</table>

### Research

<table>
<tr>
<td width="55%" valign="top"><img src="assets/demos/phase.gif" width="100%" alt="The phase-contrast browser demo: picking a sample micrograph, then dragging the halo-width, subtraction-strength and CLAHE sliders while the cleaned image and its PSNR and SSIM update."></td>
<td valign="top">
<b><a href="https://github.com/akshayaa-403/phase-contrast-denoising">Phase-contrast clean-up</a></b> · 2026<br>
<sub>Python · OpenCV · PyTorch · Gradio</sub><br><br>
Takes the bright halo off phase-contrast microscopy. A difference-of-Gaussians pass and CLAHE, then an optional 31M-parameter residual U-Net that predicts the leftover artifact and subtracts it. The browser port of the classical half agrees with OpenCV to about 50 dB PSNR.<br><br>
<sub>Recorded running the repo's <code>docs/</code> demo locally.</sub><br>
<a href="https://github.com/akshayaa-403/phase-contrast-denoising">code</a> · <a href="https://akshayaa-403.github.io/portfolio/work/phase-contrast-denoising.html">case study</a>
</td>
</tr>
<tr>
<td valign="top"><img src="assets/demos/quant.gif" width="100%" alt="The Quantamental Screener's Streamlit app: running the screener over 50 stocks, the ranked table of composite and factor scores, then the score distribution and factor-contribution charts."></td>
<td valign="top">
<b><a href="https://github.com/akshayaa-403/quantamental-screener">Quantamental Screener</a></b> · 2025–26<br>
<sub>Python · pandas · Streamlit · Redis · Docker</sub><br><br>
Ranks S&amp;P 500 stocks on momentum, news sentiment, volume and volatility. Each factor is z-scored across the day's universe, clipped at ±3 and weighted 0.4 / 0.3 / 0.2 / 0.1. Sentiment is VADER and TextBlob, with FinBERT optional. It has a rebalancing backtest.<br><br>
<sub>Recorded on the hosted app with its mock-sentiment switch on.</sub><br>
<a href="https://quantamental-screener.streamlit.app">app</a> · <a href="https://github.com/akshayaa-403/quantamental-screener">code</a> · <a href="https://akshayaa-403.github.io/portfolio/work/quantamental-screener.html">case study</a>
</td>
</tr>
<tr>
<td valign="top"><img src="assets/demos/wiki.gif" width="100%" alt="The Wikipedia Summarizer: typing Black hole, running the four summarisers, then scrolling through their summaries, ROUGE scores and charts."></td>
<td valign="top">
<b><a href="https://github.com/akshayaa-403/Wikipedia-Summarizer">Wikipedia Summarizer</a></b> · 2025–26<br>
<sub>JavaScript · Playwright</sub><br><br>
Runs TextRank, LSA, Luhn and MMR over any Wikipedia article in the browser. It scores each summary with ROUGE against the article's own lead, trimmed to the same word budget. The best reaches 56–67% of that human ceiling, and everything recomputes in about 60 ms. 33 Playwright checks drive the real page.<br><br>
<a href="https://akshayaa-403.github.io/Wikipedia-Summarizer/">demo</a> · <a href="https://github.com/akshayaa-403/Wikipedia-Summarizer">code</a> · <a href="https://akshayaa-403.github.io/portfolio/work/wikipedia-summarizer.html">case study</a>
</td>
</tr>
</table>

### Products

<table>
<tr>
<td width="55%" valign="top" align="center"><img src="assets/demos/habita.gif" width="300" alt="Habita at phone size: adding tasks to the Focus and Goals quadrants, then dragging one onto the day timeline and tapping the others to auto-place them."></td>
<td valign="top">
<b><a href="https://github.com/akshayaa-403/Habita">Habita</a></b> · 2026<br>
<sub>JavaScript · Capacitor · Java</sub><br><br>
An Android task manager built on the Eisenhower matrix. You sort tasks by urgency and importance, then drag them onto a day timeline. A small native plugin over Android's CalendarContract writes each block into the phone's own calendar. There's no published build yet.<br><br>
<sub>Recorded as the browser build, where calendar sync is off.</sub><br>
<a href="https://github.com/akshayaa-403/Habita">code</a> · <a href="https://akshayaa-403.github.io/portfolio/work/habita.html">case study</a>
</td>
</tr>
<tr>
<td valign="top"><img src="assets/demos/arteza.gif" width="100%" alt="The Arteza storefront: the hand-painted hero, a carousel of original paintings, and the five curated collections."></td>
<td valign="top">
<b><a href="https://arteza.site">Arteza</a></b> · client<br>
<sub>React · Supabase</sub><br><br>
A storefront for an original-art studio, with the work in five curated collections, a style quiz, class booking, and a checkout that hands off to WhatsApp, where the studio already sells. It's client work, so there's no public repo.<br><br>
<a href="https://arteza.site">live</a> · <a href="https://akshayaa-403.github.io/portfolio/work/arteza.html">case study</a>
</td>
</tr>
</table>

### Experiments

<table>
<tr>
<td width="55%" valign="top"><img src="assets/demos/anttodo.gif" width="100%" alt="anttodo: running the ant colony over a day's tasks, switching between the ants and the pheromone view, then the before-and-after comparison of the task order."></td>
<td valign="top">
<b><a href="https://github.com/akshayaa-403/anttodo">anttodo</a></b> · 2026<br>
<sub>JavaScript · Canvas</sub><br><br>
Ant colony optimisation on a day's tasks, drawn live. There are two modes: a real TSP over errands with haversine distances, and a cost function over a workday. It uses Max-Min Ant System bounds, dependency-aware construction and 2-opt. 104 test assertions run against the shipped page.<br><br>
<a href="https://akshayaa-403.github.io/anttodo/">demo</a> · <a href="https://github.com/akshayaa-403/anttodo">code</a> · <a href="https://akshayaa-403.github.io/portfolio/work/anttodo.html">case study</a>
</td>
</tr>
<tr>
<td valign="top"><img src="assets/demos/agent.gif" width="100%" alt="agent_project: typing a request, running the agent, then scrolling through the plan, the results of each step and the model's reflection."></td>
<td valign="top">
<b><a href="https://github.com/akshayaa-403/agent_project">agent_project</a></b> · 2026<br>
<sub>Python · FastAPI · Ollama</sub><br><br>
A small agent that plans a request, executes each step, reflects on the result and writes a .docx. It runs a local Llama 3.2 through Ollama. The research step is a stub, so the output shows the loop rather than real research.<br><br>
<sub>Recorded running locally.</sub><br>
<a href="https://github.com/akshayaa-403/agent_project">code</a>
</td>
</tr>
<tr>
<td valign="top" align="center"><sub>No recording yet. The demo page is built, but the trained weights aren't published, so it has no model to run.</sub></td>
<td valign="top">
<b><a href="https://github.com/akshayaa-403/yosemite-image-translation-gan">yosemite-image-translation-gan</a></b> · 2025–26<br>
<sub>Python · PyTorch · ONNX</sub><br><br>
A CycleGAN that turns summer photographs of Yosemite into winter ones and back, trained on unpaired images. I rebuilt it from a Colab notebook with 64 tests, fixing the notebook's real bugs along the way.<br><br>
<a href="https://github.com/akshayaa-403/yosemite-image-translation-gan">code</a>
</td>
</tr>
</table>
