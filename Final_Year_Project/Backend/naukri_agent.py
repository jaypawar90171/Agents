from datetime import datetime
from selenium.webdriver.chrome.options import Options
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import random
import re
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
from typing import TypedDict, List
from langchain_core.output_parsers import JsonOutputParser
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, START, END
import json
import pymongo
import ollama
import os
from dotenv import load_dotenv

load_dotenv()

class JobPosting(BaseModel):
    skills_required: List[str] = Field(description="List of technical and soft skills required")
    job_description_summary: str = Field(description="A expository summary of the Job Description, Required Skills And Qualifications, Preferred Qualifications; must be 3 to 5 sentences long and presented as a single paragraph")

class AgentState(TypedDict):
    job_url: str            # Input: The URL to process
    job_title: str          # Input: The title (for context)
    company: str            # Input: The company (for context)
    location: str           # Input: The job location (for context)
    cleaned_content: str    # Internal: Text scraped from the specific URL
    extracted_data: dict    # Output: The final JSON result
    skills_required: list    # Extracted skills list
    job_description_summary: str    # Extracted job description summary

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("NAUKRI_DB_NAME", "job_portal") # Second arg is a default fallback
COLLECTION_NAME = os.getenv("NAUKRI_COLLECTION_NAME", "jobs")
MODEL_NAME = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")

client = pymongo.MongoClient(MONGO_URI) # Connect to MongoDB
collection = client[DB_NAME][COLLECTION_NAME] # Select database and collection

print(f"Connected to database: {DB_NAME}")

# LLM Configuration
llm = ChatOllama(model="granite4", temperature=0, format="json")
parser = JsonOutputParser(pydantic_object=JobPosting)

def setup_driver():
    options = Options()
    # options.add_argument("--headless") 
    options.add_argument("--start-maximized")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/110.0.0.0 Safari/537.36")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    return driver

def get_job_links(keyword, location=None, max_pages=10):
    """
    Standard Python function (not a node) to get a list of URLs.
    """
    driver = setup_driver()
    jobs_data = []
    
    base_url = "https://www.naukri.com/"
    query_part = f"{keyword}-jobs"
    if location:
        query_part += f"-in-{location}"
    query_part = query_part.replace(" ", "-")
    url = f"{base_url}{query_part}"

    print(f"Starting Search Scraper for: {url}")

    try:
        driver.get(url)
        time.sleep(3)
        current_page = 1
        
        while current_page <= max_pages:
            print(f"Processing search page {current_page}...")
            
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.XPATH,"//div[contains(@class, 'cust-job-tuple')]"))
                )
            except:
                print("Timeout waiting for job list.")
                break

            # Scroll to load dynamic content
            for _ in range(3):
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)

            job_cards = driver.find_elements(By.XPATH,"//div[contains(@class, 'cust-job-tuple')]")
            
            for card in job_cards:
                try:
                    link_elem = card.find_element(By.TAG_NAME, "a")
                    link = link_elem.get_attribute("href")
                    title = link_elem.text.strip()

                    company_elem = card.find_element(By.CLASS_NAME,"row2")
                    company_a = company_elem.find_element(By.TAG_NAME, "a")
                    company = company_a.text.strip()
                     # --- NEW: extract location ---
                    location = ""
                    try:
                        location_elem = card.find_element(By.XPATH,
                        ".//*[contains(@class,'loc') or contains(@class,'Loc') or contains(@class,'location')]"
                        )
                        location = location_elem.text.strip()
                    except:
                        print("⚠️ Location not found for this job, leaving blank.")
                        pass
                    if link:
                        jobs_data.append({"title": title, "url": link, "company": company, "location": location})
                except:
                    print("No cards found, error occured")
                    break
            
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
                print(f"Clicked pagination for page {next_page_num}")
                time.sleep(random.uniform(2, 4))
                current_page += 1
            except Exception as e:
                print(f"No more pagination button for page {next_page_num} ({e})")
                break
            # Pagination logic here (simplified for brevity)
            # break # Remove this break if you want to actually page through results

        print(f"Total jobs links found: {len(jobs_data)}")
        return jobs_data

    finally:
        driver.quit()

def fetch_job_content_node(state: AgentState):
    """
    Node 1: Takes the URL from state, visits it, and updates state with text content.
    """
    url = state["job_url"]
    print(f"Agent fetching content for: {url}")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        driver = setup_driver()
        driver.get(url)
        time.sleep(3)

        section = driver.find_element(By.XPATH, "//section[contains(@class, 'styles_job-desc-container')]")

        if section:
            raw_text = section.text
            clean_text = re.sub(r'\s+', ' ', raw_text).strip()
        else:
            body = driver.find_element(By.TAG_NAME, "body")
            raw_text = body.text
            clean_text = re.sub(r'\s+', ' ', raw_text).strip()[:3000]
        
        return {"cleaned_content": clean_text}
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
            "skills_required": result.get("skills_required", []),
            "job_description_summary": result.get("job_description_summary", "")
        }
    except Exception as e:
        print(f"Extraction Error: {e}")
        return {"extracted_data": {"error": "Failed to parse JSON"}}

def store_to_database(state: AgentState):
    """
    Node 3: Generate embeddings and store to MongoDB
    """

    print("Storing data to MongoDB...")

    # Filter out non-essential keys
    keys_to_exclude = ["extracted_data", "cleaned_content"]
    job_data = {k: v for k, v in state.items() if k not in keys_to_exclude}

    # Check if skills were extracted
    if not job_data.get("skills_required"):
        print("No skills extracted, skipping storage")
        return {}

    # Create text for embedding
    skills_text = "Job Skills: " + " ".join(job_data.get("skills_required", []))

    job_text = f"""
    Job Title: {job_data.get('job_title','')}
    Company: {job_data.get('company','')}
    Location: {job_data.get('location','')}

    Skills:
    {" ".join(job_data.get('skills_required', []))}

    Summary:
    {job_data.get('job_description_summary','')}
    """
    try:
        skills_response = ollama.embeddings(
            model=MODEL_NAME,
            prompt=skills_text
        ) # Tokenization and embedding generation

        print(skills_response)
        jobs_response = ollama.embeddings(
            model=MODEL_NAME,   
            prompt=job_text
        )
        print(jobs_response)
        jobs_vector_embedding = jobs_response['embedding'] # Extract the embedding
        skills_vector_embedding = skills_response['embedding'] # Extract the embedding

        # CRITICAL: Print the dimension to confirm (usually 1024 for this model)
        print(f"Vector Dimensions Generated: {len(skills_vector_embedding)}")

        # 5. Add Embedding to Document
        document_to_save = job_data.copy()
        document_to_save["skills_embedding"] = skills_vector_embedding
        document_to_save["job_embedding"] = jobs_vector_embedding
        document_to_save["ingested_at"] =str(datetime.now())# Add timestamp for record-

        # 6. Save to MongoDB
        result = collection.insert_one(document_to_save)
        print(f"Document saved with ID: {result.inserted_id}")

        return {}

    except Exception as e:
        print(f"Error: {e}")
        return {}
    
    
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


if __name__ == "__main__":
    KEYWORD = "python"
    LOCATION = "bangalore"

    # 1. Get List of Links (Standard Python)
    job_list = get_job_links(KEYWORD, LOCATION, max_pages=10)

    print(f"\nFound {len(job_list)} jobs. Starting AI Pipeline...\n")

    # 2. Loop through and invoke Agent for each
    for i, job in enumerate(job_list):
        # if i == 3: # Limit to 3 for testing
        #     break
        url = job['url']
        title = job['title']
        company = job['company']
        location = job["location"]
        
        print(f"--- Processing Job {i+1}/{len(job_list)}: {title} ---")
        
        # Initialize state for this specific job
        initial_state = {
            "job_url": url,
            "job_title": title,
            "company": company,
            "location": location,
            "cleaned_content": "",
            "extracted_data": {},
            "skills_required": [],
            "job_description_summary": ""
        }
        
        # Invoke the Graph
        result = app.invoke(initial_state)
        
       # Get Final Output
        keys_to_exclude = {"extracted_data", "cleaned_content"}
        extracted = {k: v for k, v in result.items() if k not in keys_to_exclude}
        
        # Print Result
        print(f"Result: {json.dumps(extracted, indent=2)}")
        
        # Save to file 
        with open("naukri_data.jsonl", "a") as f:
            f.write(json.dumps(extracted) + "\n")

        time.sleep(1) # Be nice to the server