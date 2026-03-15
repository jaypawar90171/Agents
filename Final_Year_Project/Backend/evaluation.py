import os
from dotenv import load_dotenv
from datasets import Dataset
from ragas import evaluate
# NEW IMPORT PATHS
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_groq import ChatGroq # type: ignore
from langchain_ollama import OllamaEmbeddings # type: ignore

load_dotenv()

eval_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0
)
eval_embeddings = OllamaEmbeddings(model="qwen3-embedding:0.6b")

# Wrappers (Note: Ragas is moving toward factories, but these wrappers 
# are still the standard way to bridge LangChain for now)
ragas_llm = LangchainLLMWrapper(eval_llm)
ragas_embeddings = LangchainEmbeddingsWrapper(eval_embeddings)

data_samples = {
    "user_input": ["Job titles at Morgan Stanley 2024-2026 career roles and positions"],
    
    # This is exactly what your RAG generated
    "response": ["""Based on the provided context, the following job titles are available at Morgan Stanley:
    Java Full stack Director Software Engineering
    Java Fullstack Lead Software Engineer Vice President Software Engineering
    Python with Java Developer Associate Software Engineering"""],
    
    # The Reference must include the union of skills from BOTH documents found in your context
    "reference": ["""The career roles for Morgan Stanley include: Java Full stack Director Software Engineering, Java Fullstack Lead Software Engineer Vice President Software Engineering, Python with Java Developer Associate Software Engineering"""],
    
    # These are the raw snippets your retriever actually returned
    "retrieved_contexts": [[
            """Company: Morgan Stanley
        Title: Java Full stack Director Software Engineering
        Skills: ['Java', 'Angular', 'GenAI', 'Copilot', 'AI-driven development practices', 'SDLC', 'code reviews', 'automated testing', 'data structures', 'algorithms', 'Python', 'SQL', 'databases', 'cloud platforms', 'data engineering', 'reporting solutions', 'Power BI', 'Apache Airflow', 'OLAP tools', 'workflow automation']
        Location: Mumbai, India
        Description: We are seeking a Director to develop and maintain software solutions that support business needs, leveraging innovation and modern technologies such as Java, Angular, and AI-driven development practices. The ideal candidate will have hands-on experience in full stack software development, strong understanding of data structures and algorithms, and proficiency in additional languages and frameworks.""",

            """Company: Morgan Stanley
        Title: Java Fullstack Lead Software Engineer Vice President Software Engineering
        Skills: ['Java', 'React', 'Angular', 'Springboot', 'Microservices', 'Python', 'SQL', 'Databases', 'GenAI', 'Copilot', 'AI-driven development', 'Data structures', 'Algorithms', 'Design patterns', 'SDLC practices', 'Automated testing', 'CI/CD pipelines', 'Agile methodologies', 'Problem-solving', 'Analytical skills', 'Communication skills', 'Leadership skills', 'Stakeholder management']
        Location: Mumbai, India
        Description: We are seeking a Java Fullstack Lead to join our Operations Technology team. The successful candidate will lead the design, development, and delivery of scalable, enterprise-grade reporting and analytics solutions. The candidate will be expected to mentor and lead a high-performing team of engineers, foster a culture of technical excellence, and drive innovation through technology.""",

            """Company: Morgan Stanley
        Title: Python with Java Developer Associate Software Engineering
        Skills: ['Python', 'Java', 'Relational database', 'Microservices', 'Distributed systems', 'Build tooling', 'Linux', 'Cloud Stack', 'Docker', 'Kubernetes', 'Frontend technologies', 'Angular', 'React', 'Jenkins', 'Gradle', 'NoSQL', 'MongoDB', 'Snowflake']
        Location: Mumbai, India
        Description: Morgan Stanley is seeking a self-starter, experienced full stack developer to join the Fixed Income Front Office Technology team. The individual will work as part of the global development team to help analyze, design, develop, and document a modern technology stack to power our digital platforms."""
        ]]
}

dataset = Dataset.from_dict(data_samples)

score = evaluate(
    dataset=dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
    llm=ragas_llm,
    embeddings=ragas_embeddings
)

# DISPLAY FULL RESULTS
df = score.to_pandas()
print(df[['user_input', 'faithfulness', 'answer_relevancy', 'context_precision', 'context_recall']])