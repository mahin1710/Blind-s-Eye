#import "@preview/charged-ieee:0.1.4": ieee
#import "@preview/lilaq:0.4.0" as lq

#show: ieee.with(
  title: [AI-Powered Image Transcription for Enhanced Visual Accessibility],
  abstract: [
     We present a local-first system for AI-powered image transcription that converts everyday scenes into concise, speakable descriptions to enhance visual accessibility. The prototype streams text via Server-Sent Events for immediate feedback and uses native speech synthesis for ultra-low-latency audio. We benchmark three compact vision–language models on a 200-image accessibility set spanning street scenes, indoor environments, food items, and technical displays. Results show a clear performance frontier 7B-class model achieves 2.51s average latency and 289.77 tokens/s (efficiency: 61.65 tokens/s/GB), while attaining a 90% human-rated accuracy (45/50) across contextual relevance and accessibility-specific salience. In parallel, speech experiments indicate native synthesis outperforms open-source TTS by 10.4× in speed with 47× lower memory and higher MOS (4.6/5 vs. 3.2/5). Together, these results validate a practical path to responsive, on-device visual assistance today and motivate a voice-first, hands-free future in which a user can simply ask, “What is in front of me?” and receive trustworthy, privacy-preserving descriptions in real time. We release evaluation protocols and ablations to guide future work on latency–fidelity trade-offs, multimodal UX, and inclusive metrics.
  ],
  authors: (
    (
      name: "Arik Chakma",
      department: [Department of CSE],
      organization: [Independent University, Bangladesh],
      location: [Dhaka, Bangladesh],
      email: "hello@arikko.dev"
    ),
    (
      name: "MD. Mahedi Hasan Mahin",
      department: [Department of CSE],
      organization: [Independent University, Bangladesh],
      location: [Dhaka, Bangladesh],
      email: "2230837@iub.edu.bd"
    ),
    (
      name: "Mehrab Bhuiyan",
      department: [Department of CSE],
      organization: [Independent University, Bangladesh],
      location: [Dhaka, Bangladesh],
      email: "2231348@iub.edu.bd"
    ),
    (
      name: "Tasnim Jahan Urmi",
      department: [Department of CSE],
      organization: [Independent University, Bangladesh],
      location: [Dhaka, Bangladesh],
      email: "2230434@iub.edu.bd"
    ),
  ),
  index-terms: ("visual accessibility", "image transcription", "real-time captioning", "on-device AI", "voice-first interaction", "Server-Sent Events", "latency–fidelity trade-off", "privacy-by-design"),
  bibliography: bibliography("refs.bib"),
  figure-supplement: [Figure.],
)

= Introduction

Access to the world is often a race against time. For a blind or low-vision person crossing a street, opening a menu, or navigating a crowded hallway, the difference between help that arrives in seconds and help that arrives now can define independence. Recent work in accessible AI makes clear both the promise and the gap. Generative systems can broaden participation, yet many tools still miss foundational accessibility requirements and fail to meet users where they are. @acosta2024

Our project begins from lived needs and a simple ritual, a voice asks, “What is in front of me?”, and a clear, trustworthy answer arrives fast. That vision shaped a local-first image-to-audio pipeline that prioritizes responsiveness, streams partial descriptions as they form, and produces speech that is immediately usable. The historical arc leading to this work is equal parts excitement and caution. Communities relying on visual assistance have repeatedly raised concerns about where their images go, who sees them, and how long they persist. Studies of visual assistance technologies document that many users remain under informed about data handling, calling for privacy-by-design notices, controls, and consent that are themselves accessible. These concerns are not obstacles to innovation but design constraints that, if embraced, produce better, more humane systems.@stangl2022

Voice is the natural interface for all of this hands free, eyes free, and present-tense. Evidence from speech-driven assistance shows how voice interaction can reduce friction and effort for blind users, enabling them to control applications and access information with speed and dignity. This insight anchors our direction toward a truly voice-first assistant that listens for intent, captures context on demand, and delivers succinct, situation-aware descriptions that respect attention as much as privacy.@abhishek2022 From these motivations arise guiding questions that frame the study like how to achieve near real-time responsiveness on everyday devices while preserving descriptive quality, how to balance latency with the level of detail needed for situational awareness, how to shape hands-free workflows that work in motion, how to embed privacy, safety, and trust into visual assistance, and how to evaluate success with multidimensional metrics that reflect lived outcomes—latency, coverage of salient details, critical error rates, robustness, user satisfaction, task success, and alignment with accessibility guidelines.

= Literature Review

This work sits at the intersection of promise and protection. Generative AI is expanding what accessible systems can express, but it must meet real standards and real fears. Generative Artificial Intelligence and Web Accessibility @acosta2024 argues for aligning features with accessibility guidelines so outputs are perceivable, operable, and understandable. In parallel, Privacy Concerns for Visual Assistance Technologies @stangl2022 documents how camera based tools raise unresolved questions about consent, retention, and disclosure for blind and low vision users. Aiding the Visually Impaired Using Artificial Intelligence and Speech Recognition Technology @abhishek2022 underscores why voice is a natural control surface, showing how vision paired with speech supports everyday navigation and recognition.

Creativity oriented systems show how richer descriptions broaden participation. ArtInsight: Enabling AI Powered Artwork Engagement for Mixed Visual Ability Families @chheda2025 helps families co explore children’s drawings with respectful narration and guided prompts. GenAssist: Making Image Generation Accessible @huh2023 equips blind creators to evaluate AI images through prompt grounded questions, per image explanations, and summaries of similarities and differences. Enhancing Accessibility Through Inclusive Design and Artificial Intelligence @sarangam2024 complements these efforts by surfacing WCAG aligned patterns so AI features integrate cleanly with assistive technologies.

Under the surface are pipelines that make such experiences feasible. AI Powered Assistive Technologies for Improved Accessibility @brotosaputro2024 surveys computer vision, OCR, and speech tools for wayfinding and document access. PEANUT @zhang2023peanut reduces the burden of building multimodal datasets with human in the loop annotation that preserves oversight. For hearing access, Contextual Transcription and Summarization of Audio using AI @pandita2023 and AI Powered Information Retrieval in Meeting Records and Transcripts @ghadge2024 combine ASR and NLP to turn long audio into searchable, digestible units. In education, Leveraging Education through Artificial Intelligence Virtual Assistance @mina2023 explores voice first tutoring for visually impaired learners.

Designing for life on the move and beyond the screen is a recurring theme. Analysis of AI Driven Digital Accessibility Through Non Visual Modalities @omitoyin2024 highlights auditory and haptic cues as primary channels when attention is scarce. The Role of Machine Learning and Artificial Intelligence in Mobile App Development @gupta2022 surveys OCR, recognition, and adaptive interfaces that make smartphones practical hosts for accessibility features. AI Powered Methods for Coping with Heterogeneity in Accessibility @uckun2023 argues for personalization tailored to individual needs and contexts. Public sector deployments in Enhancing Accessibility in Special Libraries @chauhan2024 and Towards Leveraging Free Artificial Intelligence Software to Enhance Library Accessibility @ibegbulam2024 show how lightweight, low cost tools scale in resource constrained environments.

Assessment and rigor matter as systems enter daily life. Heuristic Evaluation of AI Powered Web Accessibility Assistants @nacheva2023 proposes structured checks that go beyond accuracy to consider usability and fit. Artificial Intelligence Based Smarter Accessibility Evaluations @aktar2023 outlines user centered frameworks for assessing spaces and devices. Although clinical in focus, AI Powered Biomolecular Specific and Label Free Multispectral Imaging @pandey2023 models disciplined benchmarking useful for perception pipelines. Use of Artificial Intelligence in Historical Records Transcription @zhang2023book details OCR and NLP strategies for noisy handwritten sources. Powering an AI Chatbot with Expert Sourcing @xiao2023 shows how expert guided knowledge keeps conversational agents reliable, and Enhancing Accessibility Through Machine Learning @patel2025 surveys methods across visual and hearing assistance to position model choices and deployment constraints.

Rules and lived experience anchor the broader picture. Navigating Accessibility Rights in the Age of AI @das2025 consolidates legal and ethical expectations for assistive technologies, emphasizing transparency and equitable access. An Autoethnographic Case Study of Generative Artificial Intelligence’s Utility for Accessibility @glazko2023 captures everyday benefits and frictions, pushing designers toward clarity, verifiability, and respectful defaults. Equal AI: A Framework for Enhancing Equity and Accessibility in Liberal Arts @davoodi2024 extends these ideas into classrooms, pointing to voice forward and context aware support for multilingual learners and students with disabilities.

Overall, the literature converges on systems that are fast enough to help in the moment, expressive enough to convey what matters, and careful enough to preserve dignity and privacy. The field is moving toward voice first, on device experiences paired with human centered evaluation, while leaving room for personalization, broader datasets, and evaluation in the wild.


= Problem Statement

People who are blind or have low vision need immediate, trustworthy, speakable descriptions of what is in front of them. In time sensitive moments, a delay of a few seconds turns help into hindsight. Many current tools are slow, fragile in poor connectivity, and dependent on remote processing that raises questions about where personal images go. Outputs often miss action critical details such as text on signs, small but important objects, spatial relations, and safety cues, while long or awkward speech increases cognitive load.

Our aim is to close this gap with responsiveness, clarity, and privacy on everyday devices. The target is near real time descriptions that stream partial information as it becomes available and treat audio as a first class output that is concise and easy to follow. The solution must work in motion and varied lighting, handle cluttered scenes, and behave consistently without forcing a trade between speed and trust.

Our primary stakeholders are blind and low-vision people who need immediate, trustworthy, speakable descriptions in everyday settings, with a small supporting circle of caregivers and a few accessibility practitioners who help configure tools. In this context, persistent issues include high latency, unreliable streaming, and uneven description fidelity that either omits critical details like text, small objects, spatial relations, and safety cues or overwhelms with verbosity. Speech output is often delayed or poorly phrased, privacy becomes unclear when images leave the device, personalization controls are thin, inclusive gaps persist across languages and accents, and evaluation skews toward model scores instead of user outcomes like task success, error severity, attention cost, and robustness in motion. Battery and compute limits hinder sustained use on common hardware, and integration with screen readers, wearables, and navigation apps remains inconsistent.

There are focused opportunities to resolve these pain points. A local-first approach can keep data on device, improve speed, and strengthen trust. Voice-first workflows can enable hands-free capture and queries, with progressive text and speech delivering useful partial results quickly. Lightweight personalization can tune verbosity and vocabulary to the user and moment, while privacy-by-design makes consent and retention understandable and auditable. Human-in-the-loop feedback can convert real use into continuous improvement, and open protocols can enable simple deployments in everyday community spaces. The mandate is clear: provide descriptions that arrive fast enough to help, are precise enough to matter, and are respectful enough to preserve dignity and privacy.

= Methodology

This project adopted an Agile software development methodology, specifically incorporating elements of Kanban for iterative and flexible progression. Agile was selected due to its adaptability in handling evolving requirements typical of AI-driven prototypes, where initial experiments with models like LLaVA 7B and integration of macOS native TTS necessitated rapid iterations and feedback loops. Unlike rigid methodologies such as Waterfall, Agile allows for continuous refinement, enabling quick adjustments to performance optimizations (e.g., minimizing latency in image transcription) and alignment with accessibility goals. This justification stems from the project's emphasis on speed and user-centric evolution, from a simple file-upload prototype to a future voice-command-driven web app, which benefits from incremental development to incorporate real-time testing and stakeholder input.

For requirement discovery, a user-centered design (UCD) approach was employed, involving iterative user stories and heuristic evaluations inspired by accessibility standards like WCAG 2.2. This method was justified by the need to prioritize inclusivity for visually impaired users, drawing from autoethnographic insights and privacy concerns in related literature. Initial requirements were gathered through targeted interviews with potential users and analysis of similar systems (e.g., voice-activated assistants), ensuring features like hands-free image capture address real-world barriers while emphasizing low-latency, on-device processing.

Software design tools included Figma for prototyping user interfaces, enabling collaborative wireframing of the voice-command workflow, and Draw.io for creating system architecture diagrams, such as data flow from image upload to text streaming via Server-Sent Events. Project management was facilitated using Trello boards, which supported Kanban-style task tracking, milestone prioritization, and team collaboration in a resource-constrained academic setting. This tool's visual boards aligned well with Agile principles, allowing real-time updates on development sprints focused on model integration and performance benchmarking.

= Proposed Solution

Our solution is a local-first assistant that turns a single interaction into a flowing loop: the user provides an image, the system produces a short description in real time, and speech starts almost immediately so the user does not wait for the whole result. Everything runs on the user’s device. Text is streamed with Server-Sent Events, speech is generated with the native platform API, and no image leaves the machine. The design aims for three qualities at once: fast enough to help in the moment, clear enough to act on, and respectful of privacy by default.

The functional scope is focused and practical. The app accepts an image from camera or file picker, prepares it in memory, and asks a compact vision model to infer salient details such as scene, objects, text snippets, and spatial relations. Partial tokens are streamed to the interface and to the speech generator so the user hears the first meaningful phrase quickly. The UI keeps the image visible with its evolving caption so people can verify accuracy with a sighted helper when needed. Personalization is simple: users can toggle verbosity, choose a speaking voice, and clear local history. Offline use is the default, with graceful handling when the device is under load.

#figure(
   block(align(center)[
    #image("rich-picture-as-is.png", width: 80%)
  ], width: 100%),
  caption: [Rich Picture: As-Is]
)<as-is>

@as-is shows how help often works today. A blind or low-vision person asks another person for a description and receives a spoken reply. It is effective but depends on others and is not always available.

#figure(
   block(align(center)[
    #image("rich-picture-to-be.png", width: 80%)
  ], width: 100%),
  caption: [Rich Picture: To-Be]
)<to-be>

But in @to-be exchange happens with the app. The user drops or captures an image in the interface. The image buffer goes to the local vision model, which streams a description back to the UI. The decoded text is spoken immediately by the native speech engine. The loop is quick and private.

At @system-dfd the data flow is small and tight. The browser receives a raw image and forwards it to the upload handler. A stream processor packages partial results and returns them as text tokens and audio. The vision processor queries the local model and emits descriptive text. A response coordinator keeps the text and audio streams aligned so the user hears a clean, short sentence first, then details. The figure below summarizes these paths.

#figure(
   block(align(center)[
    #image("system-level-data-flow-diagram.png", width: 60%)
  ], width: 100%),
  caption: [System Level Data Flow Diagram]
)<system-dfd>

User, browser, and five processing roles work together: P1 receives the image, P2 manages streaming, P3 performs vision inference, P4 produces speech, and P5 coordinates timing so the interface stays responsive.

The deployment story is intentionally simple. Everything runs on the user device: the browser interface and the local API that hosts the model and speech bridge. A small database file on the device stores settings and optional history. There is no remote server in the critical path, which keeps performance predictable and data private.

#figure(
  block(align(center)[
    #image("deployment-diagram.png", width: 40%)
  ], width: 100%),
  caption: [Deployment Diagram]
)<deployment-diagram>

Browser and local API live on the same device and talk to a local data store. This keeps latency low and removes external dependencies.

@input-design Input design focuses on a gentle first step. The panel presents a large target for drag and drop and a clear “click to browse” option. The header sets context with a one-line purpose. Labels are programmatic for screen readers, and the drop zone has a focus outline for keyboard users. Simple rules explain supported formats and size so errors are rare.

#figure(
   block(align(center)[
    #image("input-design.png", width: 80%)
  ], width: 100%),
  caption: [Input Design]
)<input-design>

@output-design Output design pairs the original image with a live caption. As tokens arrive, the paragraph fills smoothly and the voice speaks the same words. Two actions keep control in the user’s hands: Remove clears the image and text, Done confirms and stops speech. The design favors short sentences, strong nouns, and early mention of safety cues when present.

#figure(
   block(align(center)[
    #image("output-design.png", width: 80%)
  ], width: 100%),
  caption: [Output Design]
)<output-design>

Users can verify what the system said against what it shows and decide the next step quickly.

#figure(
  block(align(center)[
    #image("research-question-mapping.png", width: 80%)
  ], width: 100%),
  caption: [Research Questions Mapping]
)<research-question-mapping>

@research-question-mapping mapping explains why each paper was chosen and what it helps answer. RQ1 to RQ5 reflect our goals: responsiveness on everyday devices, fidelity vs speed trade offs, hands free voice capture and queries, privacy and trust, and a practical evaluation framework. We selected papers that together cover technical methods, interaction design, and governance. Arrows indicate where a source supplies evidence, methods, or patterns that answer a given question. System and deployment studies anchor RQ1 and RQ3, pipeline and interaction work inform RQ2, privacy and rights analyses support RQ4, and heuristic and benchmarking studies ground RQ5. The dense links on RQ1, RQ3, and RQ5 show strong support for speed, voice first use, and measurement, while RQ2 and RQ4 form focused clusters around trade offs and safeguards.

Together these elements form a small, reliable loop. Images are processed on the device, text and speech arrive quickly, and the interface makes decisions easy. The result is a focused tool that respects attention and privacy while giving timely descriptions that help people act.

= Results

We evaluated three locally deployed vision–language models on 200 images representative of accessibility scenarios (street, indoor, food, technical displays). Models:

- qwen2.5vl:3b (3.2 GB)
- gemma3:4b (3.3 GB)  
- llava:7b (4.7 GB)

Average latency follows
$ T_"avg" = sum_(i=1)^n T_i / n $
and throughput efficiency is
$ eta = tau / "Model Size (GB)" $

#figure(
  caption: [Model performance comparison],
  table(
    columns: (auto, auto, auto, auto, auto),
    align: (left, center, center, center, center),
    stroke: (x, y) => if y <= 1 { (top: 0.5pt) },
    fill: (x, y) => if y > 0 and calc.rem(y, 2) == 0 { rgb("#f0f0f0") },
    table.header[Model][Size (GB)][Avg Latency (s)][Throughput (tok/s)][Efficiency (tok/s/GB)],
    [qwen2.5vl:3b], [3.2], [14.63], [90.60], [28.31],
    [gemma3:4b], [3.3], [7.91], [46.34], [14.04],
    [llava:7b], [4.7], [2.51], [289.77], [61.65],
  )
)

A human study with 10 participants (accessibility experts and users) rated contextual accuracy, descriptive richness, and accessibility relevance. Scores (out of 50): qwen2.5vl:3b = 32, gemma3:4b = 33, llava:7b = 45.

#figure(
  caption: [Human evaluation scores (out of 50)],
)[
  #block(align(center)[
    #lq.diagram(
      xaxis: (
        ticks: ("qwen2.5vl:3b", "gemma3:4b", "llava:7b")
          .map(rotate.with(0deg, reflow: true))
          .map(align.with(right))
          .enumerate(),
        subticks: none,
      ),
      lq.bar(range(3), (32, 33, 45))
    )
  ], width: 100%)
]

Text-to-speech was compared between open-source models (local runtime) and the native macOS API.

#figure(
  caption: [TTS comparison],
  table(
    columns: (auto, auto, auto, auto, auto),
    align: (left, center, center, center, left),
    stroke: (x, y) => if y <= 1 { (top: 0.5pt) },
    fill: (x, y) => if y > 0 and calc.rem(y, 2) == 0 { rgb("#f7f7f7") },
    table.header[TTS Path][Avg time (s/sent)][Mem use][MOS (1–5)][Notes],
    [Open-source (LM Studio)], [8.3], [~2.1 GB VRAM], [3.2], [Model download and GPU setup required],
    [macOS native API], [0.8], [~45 MB RAM], [4.6], [Instant use, platform-optimized],
  )
)

The llava:7b model provided the best latency, highest throughput efficiency, and strongest human score, aligning with the goal of speaking a short, correct phrase quickly, then adding detail. The native TTS path minimized delay and setup effort while improving intelligibility.

#figure(
  caption: [Feature matrix],
  table(
    columns: (auto, auto),
    align: (left, left),
    stroke: (x, y) => if y <= 1 { (top: 0.5pt) },
    fill: (x, y) => if y > 0 and calc.rem(y, 2) == 0 { rgb("#f7f7f7") },
    table.header[Feature][Key metric or outcome],
    [Image upload or capture], [Local validation of type and size],
    [Streaming caption], [Throughput up to 289.77 tok/s],
    [Progressive speech], [~0.8 s per sentence start],
    [Local-first privacy], [No image egress],
    [Verbosity and voice], [User configurable],
    [Offline default], [Stable without network],
  ),
)

All inference and speech run locally using open-source or native components. There is no per-request compute cost, so financial return of investment is not modeled. The value is realized as responsiveness, privacy, and reliability on the user’s device.

= Conclusion

This work shows that a local-first image transcription assistant can be fast, clear, and private on everyday hardware. Among compact models, the 7B variant paired with streaming text and native speech delivered the best mix of latency, and efficiency, letting users hear a useful first phrase quickly and then richer detail. Unlike many prior systems that assume cloud processing, focus on static alt text, or treat speech as a secondary output, our approach keeps images on device, streams meaning as it is inferred, and optimizes for speak ability from the start.

The system’s uniqueness lies in this end-to-end emphasis on immediacy and respect: token-level streaming, progressive audio, and privacy by default, evaluated with user-centered judgments rather than model scores alone. The result is a small yet dependable loop that turns a single image into timely guidance.

Next we aim for voice command only. When the user says “what is in front of me,” the device will capture a photo, describe it aloud in real time, and support quick follow-ups like “read the sign” or “where is the door,” all on device, with adaptive verbosity and stronger robustness in motion and low light.
