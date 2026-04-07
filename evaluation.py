import os
import json
from dotenv import load_dotenv
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_groq import ChatGroq  # type: ignore
from langchain_ollama import OllamaEmbeddings  # type: ignore

load_dotenv()

# ── LLM / Embeddings setup ────────────────────────────────────────────────────
eval_llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
eval_embeddings = OllamaEmbeddings(model="qwen3-embedding:0.6b")

# Wrappers (Note: Ragas is moving toward factories, but these wrappers 
# are still the standard way to bridge LangChain for now)
ragas_llm = LangchainLLMWrapper(eval_llm)
ragas_embeddings = LangchainEmbeddingsWrapper(eval_embeddings)


# ── Helper: format a retrieved_context object into a readable string ──────────
def format_context(ctx: dict | str) -> str:
    """Convert a context dict (company/title/skills/description) to a string."""
    if isinstance(ctx, str):
        return ctx
    parts = []
    if ctx.get("company"):
        parts.append(f"Company: {ctx['company']}")
    if ctx.get("title"):
        parts.append(f"Title: {ctx['title']}")
    if ctx.get("skills"):
        skills = ctx["skills"]
        parts.append(f"Skills: {skills if isinstance(skills, str) else str(skills)}")
    if ctx.get("location"):
        parts.append(f"Location: {ctx['location']}")
    if ctx.get("description"):
        parts.append(f"Description: {ctx['description']}")
    return "\n".join(parts)


# ── Helper: normalise a single sample from eval_data.json ────────────────────
def normalise_sample(sample: dict) -> dict:
    """Return a dict with plain-string user_input, response, reference and a
    list-of-strings retrieved_contexts — regardless of the original format."""

    # user_input: could be list["..."] or plain string
    user_input = sample["user_input"]
    if isinstance(user_input, list):
        user_input = " ".join(user_input)

    # response: could be list["..."] or plain string
    response = sample["response"]
    if isinstance(response, list):
        response = " ".join(response)

    # reference: could be list[str] (multiple sentences) or list[list] or str
    reference_raw = sample["reference"]
    if isinstance(reference_raw, list):
        # flatten: join all strings in the list into one reference string
        reference = " ".join(
            item if isinstance(item, str) else str(item)
            for item in reference_raw
        )
    else:
        reference = str(reference_raw)

    # retrieved_contexts: list of dicts or list of strings
    raw_contexts = sample.get("retrieved_contexts", [])
    retrieved_contexts = [format_context(c) for c in raw_contexts]

    return {
        "user_input": user_input,
        "response": response,
        "reference": reference,
        "retrieved_contexts": retrieved_contexts,
    }


# ── Load eval_data.json ───────────────────────────────────────────────────────
eval_data_path = os.path.join(os.path.dirname(__file__), "Evaluations", "eval_data.json")

with open(eval_data_path, "r", encoding="utf-8") as f:
    raw_samples = json.load(f)

print(f"Loaded {len(raw_samples)} evaluation samples from eval_data.json\n")

# ── Build the RAGAS dataset ───────────────────────────────────────────────────
data_samples = {
    "user_input": [],
    "response": [],
    "reference": [],
    "retrieved_contexts": [],
}

for sample in raw_samples:
    normalised = normalise_sample(sample)
    data_samples["user_input"].append(normalised["user_input"])
    data_samples["response"].append(normalised["response"])
    data_samples["reference"].append(normalised["reference"])
    data_samples["retrieved_contexts"].append(normalised["retrieved_contexts"])

dataset = Dataset.from_dict(data_samples)

# ── Run RAGAS evaluation ──────────────────────────────────────────────────────
score = evaluate(
    dataset=dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
    llm=ragas_llm,
    embeddings=ragas_embeddings,
)

# ── Display results ───────────────────────────────────────────────────────────
df = score.to_pandas()
print(df[["user_input", "faithfulness", "answer_relevancy", "context_precision", "context_recall"]])