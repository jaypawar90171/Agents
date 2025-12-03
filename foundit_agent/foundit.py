import csv
import random
import time
import requests
from bs4 import BeautifulSoup
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import json
from typing import TypedDict, List
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, START, END
from pydantic import BaseModel, Field
import pymongo
from dotenv import load_dotenv
import os
import ollama
load_dotenv()


# --- 1. CONFIGURATION & SCHEMA ---

# Define the Pydantic model for output validation
class JobPosting(BaseModel):
    skills_required: List[str] = Field(description="List of technical and soft skills required")
    job_description_summary: str = Field(description="A expository summary of the Job Description, Required Skills And Qualifications, Preferred Qualifications; must be 3 to 5 sentences long and presented as a single paragraph")

# Define the State that passes through the Agent
class AgentState(TypedDict):
    job_url: str            # Input: The URL to process
    job_title: str          # Input: The title (for context)
    cleaned_content: str    # Internal: Text scraped from the specific URL
    extracted_data: dict    # Output: The final JSON result
    skills_required: list   
    company: str
    job_description_summary: str

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("FOUNDIT_DB_NAME", "job_portal") # Second arg is a default fallback
COLLECTION_NAME = os.getenv("FOUNDIT_COLLECTION_NAME", "jobs")
MODEL_NAME = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")

client = pymongo.MongoClient(MONGO_URI)
collection = client[DB_NAME][COLLECTION_NAME]

print(f"Connected to database: {DB_NAME}")

# Initialize Local LLM (Ollama)
# Make sure you have run `ollama run granite4` (or your chosen model) in your terminal
llm = ChatOllama(model="granite4", temperature=0, format="json")
parser = JsonOutputParser(pydantic_object=JobPosting)

# --- 2. PHASE 1: SELENIUM SEARCH SCRAPER (Getting the List) ---
# This runs OUTSIDE the agent to generate the list of work
def setup_driver():
    options = Options()
    # options.add_argument("--headless") 
    options.add_argument("--start-maximized")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/110.0.0.0 Safari/537.36")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    return driver

def get_job_links(keyword, location=None, max_pages=1):
    """
    Standard Python function (not a node) to get a list of URLs.
    """
    driver = setup_driver()
    jobs_data = []
    
    base_url = "https://www.foundit.in/search/"
    query_part = f"{keyword}-jobs"
    if location:
        query_part += f"-in-{location}"
    query_part = query_part.replace(" ", "-")
    url = f"{base_url}{query_part}"

    print(f"🚀 Starting Search Scraper for: {url}")

    try:
        driver.get(url)
        time.sleep(3)
        current_page = 1
        
        while current_page <= max_pages:
            print(f"⏳ Processing search page {current_page}...")
            
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.XPATH,
                                                    "//div[contains(@class, 'srpResultCard')] | "
                                                    "//div[contains(@class, 'cardContainer')] | "
                                                    "//div[contains(@class, 'job-card')] | "
                                                    "//div[contains(@id, 'srp-jobList')]"))
                )
            except:
                print("⚠️ Timeout waiting for job list.")
                break

            # Scroll to load dynamic content
            for _ in range(3):
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)

            job_cards = driver.find_elements(By.XPATH, 
                                             "//div[contains(@class, 'srpResultCard')] | "
                                             "//div[contains(@class, 'cardContainer')] | "
                                             "//div[contains(@class, 'job-card')]")
            
            for card in job_cards:
                try:
                    link_elem = card.find_element(By.TAG_NAME, "a")
                    link = link_elem.get_attribute("href")
                    title = link_elem.text.strip()

                    company_elem = card.find_element(By.TAG_NAME, "span")
                    company_a = company_elem.find_element(By.TAG_NAME, "a")
                    company = company_a.text.strip()
                    if link:
                        jobs_data.append({"title": title, "url": link, "company": company})
                except:
                    continue
            
            next_page_num = current_page + 1
            if next_page_num > max_pages:
                break
            try:
                page_btn_xpath = f"//*[self::button or self::a][normalize-space(text())='{next_page_num}']"
                btn = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, page_btn_xpath))
                )
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                time.sleep(1)
                btn.click()
                print(f"👉 Clicked pagination for page {next_page_num}")
                time.sleep(random.uniform(2, 4))
                current_page += 1
            except Exception as e:
                print(f"❌ No more pagination button for page {next_page_num} ({e})")
                break
            # Pagination logic here (simplified for brevity)
            # break # Remove this break if you want to actually page through results

        print(f"Total jobs links found: {len(jobs_data)}")
        return jobs_data

    finally:
        driver.quit()


# --- 3. PHASE 2: AGENT NODES (Processing One Job) ---

def fetch_job_content_node(state: AgentState):
    """
    Node 1: Takes the URL from state, visits it, and updates state with text content.
    """
    url = state["job_url"]
    print(f"   🔎 Agent fetching content for: {url}")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            div = soup.find('div', class_="break-words")
            
            if div:
                text = div.get_text(separator=' ', strip=True)
            else:
                text = soup.body.get_text(separator=' ', strip=True)[:3000] # Fallback
            
            return {"cleaned_content": text}
        else:
            return {"cleaned_content": "Error: Status Code " + str(response.status_code)}
    except Exception as e:
        return {"cleaned_content": f"Error: {e}"}

def extract_info_node(state: AgentState):
    """
    Node 2: Takes cleaned text, runs LLM, updates state with JSON.
    """
    content = state.get("cleaned_content", "")
    
    # If fetch failed, return empty
    if "Error" in content or len(content) < 50:
        return {"extracted_data": {"error": "Content fetch failed"}}

    print(f"AI Extracting data...")

    prompt = PromptTemplate(
        template="""You are an expert data extraction agent.
        Extract the following job details from the provided text.
        
        {format_instructions}
        
        Input Text:
        {context}
        """,
        input_variables=["context"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    chain = prompt | llm | parser
    
    try:
        result = chain.invoke({"context": content})
        return {
            "extracted_data": result,
            "skills_required": result["skills_required"],
            "job_description_summary": result["job_description_summary"]
            }
    except Exception as e:
        print(f" Extraction Error: {e}")
        return {"extracted_data": {"error": "Failed to parse JSON"}}

def store_to_database(state: AgentState):
    
    keys_to_exclude = {"extracted_data", "cleaned_content"}
    job_data = {k: v for k, v in state.items() if k not in keys_to_exclude} # Remove non-essential keys

    skills_text = "Job Skills: " + ", ".join(job_data["skills_required"]) # Convert list to comma-separated string

    print(f"Generating embedding for: {skills_text}")

    try:    
        response = ollama.embeddings(
            model=MODEL_NAME,
            prompt=skills_text
        ) # Tokenization and embedding generation

        vector_embedding = response['embedding'] # Extract the embedding

        # CRITICAL: Print the dimension to confirm (usually 1024 for this model)
        print(f"Vector Dimensions Generated: {len(vector_embedding)}")

        # 5. Add Embedding to Document
        document_to_save = job_data.copy()
        document_to_save["skills_embedding"] = vector_embedding

        # 6. Save to MongoDB
        result = collection.insert_one(document_to_save)
        print(f"Document saved with ID: {result.inserted_id}")

        return {}

    except Exception as e:
        print(f"Error: {e}")
        return {}


# --- 4. BUILD THE GRAPH ---

workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("fetch_content", fetch_job_content_node)
workflow.add_node("extract_data", extract_info_node)
workflow.add_node("save_data", store_to_database)

# Define edges
workflow.add_edge(START, "fetch_content")
workflow.add_edge("fetch_content", "extract_data")
workflow.add_edge("extract_data", "save_data")
workflow.add_edge("save_data", END)

# Compile
app = workflow.compile()


# --- 5. MAIN EXECUTION FLOW ---

if __name__ == "__main__":
    KEYWORD = "java"
    LOCATION = "mumbai"

    # 1. Get List of Links (Standard Python)
    job_list = get_job_links(KEYWORD, LOCATION, max_pages=1)

    print(f"\n Found {len(job_list)} jobs. Starting AI Pipeline...\n")

    # 2. Loop through and invoke Agent for each
    for i, job in enumerate(job_list):
        if i == 3:
            break
        url = job['url']
        title = job['title']
        company = job['company']
        
        print(f"--- Processing Job {i+1}/{len(job_list)}: {title} ---")
        
        # Initialize state for this specific job
        initial_state = {
            "job_url": url,
            "job_title": title,
            "company": company,
            "cleaned_content": "",
            "extracted_data": {},
            "skills_requied": [],
            "job_desc": ""
        }
        
        # Invoke the Graph
        result = app.invoke(initial_state)
        
        # Get Final Output
        keys_to_exclude = {"extracted_data", "cleaned_content"}
        extracted = {k: v for k, v in result.items() if k not in keys_to_exclude}
        
        # Print Result
        print(f"Result: {json.dumps(extracted, indent=2)}")
        
        # Save to file (optional)
        with open("foundit_data.jsonl", "a") as f:
            f.write(json.dumps(extracted) + "\n")

        time.sleep(1) # Be nice to the server