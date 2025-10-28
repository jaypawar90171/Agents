import os
import json
import re
import pandas as pd
import time
import requests
from typing import List, TypedDict, Optional
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_fireworks import ChatFireworks
from langgraph.graph import END, StateGraph
from bs4 import BeautifulSoup
import datetime

load_dotenv()

# Environment variable checks
if not os.getenv("FIREWORKS_API_KEY"):
    raise ValueError("FIREWORKS_API_KEY not found. Check your .env file!")

# Define State for our scraping workflow
class ScrapingState(TypedDict):
    messages: List[BaseMessage]
    urls: List[str]
    raw_data: List[dict]
    structured_data: List[dict]
    current_url: Optional[str]

llm = ChatFireworks(model="accounts/fireworks/models/llama-v3p3-70b-instruct")

# 1. URL Generation Agent
scraping_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a web scraping expert. Given a job search query, generate specific search URLs for TimesJobs mobile site.
     Return 3-5 relevant TimesJobs URLs, one per line. Only return URLs, no explanations.
     Format: https://m.timesjobs.com/mobile/jobs-search-result.html?jobsSearchCriteria=QUERY"""),
    MessagesPlaceholder(variable_name="messages")
])

# 2. Data Extraction Agent - IMPROVED PROMPT
extraction_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a job data extraction specialist. Extract structured job information from the provided HTML content.
     
     CRITICAL: You MUST return ONLY valid JSON format, no other text. Your response should start with {{ and end with }}.
     
     JSON Structure:
     {{
       "job_title": "string",
       "company": "string", 
       "location": "string",
       "experience": "string",
       "skills": ["list", "of", "skills"],
       "description": "string",
       "salary": "string", 
       "posted_date": "string",
       "job_url": "string",
       "source_portal": "string"
     }}
     
     Rules:
     - If information is not available, use "Not specified"
     - For skills, always return an array even if empty
     - Extract from the visible text content
     - Return ONLY the JSON object, no explanations
     - If no job data is found, return: {{"job_title": "No jobs found", "company": "Not specified", "location": "Not specified", "experience": "Not specified", "skills": [], "description": "No job listings found on this page", "salary": "Not specified", "posted_date": "Not specified", "job_url": "URL_PLACEHOLDER", "source_portal": "PORTAL_PLACEHOLDER"}}""")
])

# 3. Validation Agent
validation_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a data quality validator. Check the extracted job data for completeness and quality."""),
    MessagesPlaceholder(variable_name="messages")
])


def scrape_timesjobs_live(url):
    """Scrape live TimesJobs mobile site"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        jobs = []
        
        # Find job listings - TimesJobs mobile structure
        job_listings = soup.find_all('div', class_='srp-listing')
        
        for job in job_listings:
            try:
                # Extract job data
                title_elem = job.find('h3').find('a')
                title = title_elem.text.strip() if title_elem else "N/A"
                
                company_elem = job.find('span', class_='srp-comp-name')
                company = company_elem.text.strip() if company_elem else "N/A"
                
                location_elem = job.find('div', class_='srp-loc')
                location = location_elem.text.strip() if location_elem else "N/A"
                
                # Extract experience
                exp_elem = job.find('div', class_='srp-exp')
                experience = exp_elem.text.strip() if exp_elem else "Not specified"
                
                # Extract salary
                salary_elem = job.find('div', class_='srp-sal')
                salary = salary_elem.text.strip() if salary_elem else "Not specified"
                
                # Extract skills
                skills_elems = job.find_all('a', class_='srphglt')
                skills = [skill.text.strip() for skill in skills_elems]
                
                # Extract job URL
                job_url = title_elem.get('href') if title_elem else url
                if job_url and not job_url.startswith('http'):
                    job_url = f"https://m.timesjobs.com{job_url}" if job_url.startswith('/') else f"https://m.timesjobs.com/mobile/{job_url}"
                
                job_data = {
                    "title": title,
                    "company": company,
                    "location": location,
                    "experience": experience,
                    "salary": salary,
                    "skills": skills,
                    "url": job_url,
                    "source": "TimesJobs",
                    "scraped_at": datetime.now().isoformat()
                }
                jobs.append(job_data)
                
            except Exception as e:
                print(f"Error parsing job element: {e}")
                continue
                
        return jobs
        
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return []

def scrape_with_timesjobs(urls: List[str]) -> List[dict]:
    """
    Use TimesJobs-specific scraper to scrape multiple URLs with pagination
    """
    print(f"🚀 Starting TimesJobs batch scrape for {len(urls)} URLs...")
    
    all_scraped_data = []
    
    for base_url in urls:
        print(f"--- Scraping search: {base_url.split('?')[1][:50]}... ---")
        current_page = 1
        total_jobs_from_url = 0
        i = 0
        while i < 10:
            # Construct the URL for the current page
            paginated_url = f"{base_url}&curPage={current_page}"
            
            print(f"Scraping: {paginated_url}")
            jobs = scrape_timesjobs_live(paginated_url)
            
            if not jobs:
                print(f"No more jobs found at page {current_page}. Moving to next URL.")
                break
                
            # Convert to the format expected by the rest of the system
            for job in jobs:
                # Create clean content for LLM processing
                content_parts = [
                    f"Title: {job['title']}",
                    f"Company: {job['company']}",
                    f"Location: {job['location']}",
                    f"Experience: {job['experience']}",
                    f"Salary: {job['salary']}",
                    f"Skills: {', '.join(job['skills'])}",
                    f"URL: {job['url']}"
                ]
                clean_content = '\n'.join(content_parts)
                
                scraped_item = {
                    "url": job['url'],
                    "html": "",  # We don't have raw HTML in this approach
                    "content": clean_content,
                    "status": "success",
                    "content_length": len(clean_content),
                    "raw_job_data": job  # Keep the structured data
                }
                all_scraped_data.append(scraped_item)
                total_jobs_from_url += 1
            
            print(f"Found {len(jobs)} jobs on this page.")
            
            # Move to the next page
            current_page += 1
            if current_page > 5:  # Limit pages for demo
                print("Reached page limit. Moving to next URL.")
                break
            
            # Be polite: add a small delay to avoid spamming the server
            time.sleep(1)
            i += 1
        
        print(f"Total jobs from this URL: {total_jobs_from_url}")
    
    print(f"✅ TimesJobs scraping completed: {len(all_scraped_data)} total jobs found")
    return all_scraped_data

# Graph Nodes
SCRAPE = "scrape"
EXTRACT = "extract" 
VALIDATE = "validate"
SAVE = "save"

graph_builder = StateGraph(ScrapingState)

def scrape_node(state: ScrapingState):
    """Node that handles web scraping using TimesJobs scraper"""
    if not state.get("urls"):
        # Generate URLs based on user query
        user_query = state["messages"][-1].content
        response = scraping_chain.invoke({"messages": state["messages"]})
        
        # Parse URLs from response
        urls = []
        for line in response.content.split('\n'):
            line = line.strip()
            if line.startswith('http') and 'timesjobs' in line:
                urls.append(line)
        
        # Fallback URLs if LLM doesn't provide good ones
        if not urls:
            urls = [
                "https://m.timesjobs.com/mobile/jobs-search-result.html?jobsSearchCriteria=Information%20Technology&cboPresFuncArea=35",
                "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=Software+Engineer&cboWorkExp1=-1",
                "https://m.timesjobs.com/mobile/jobs-search-result.html?txtKeywords=Python+Developer&cboWorkExp1=-1"
            ]
        
        state["urls"] = urls
        print(f"🎯 Generated {len(urls)} TimesJobs URLs to scrape")
    
    # Scrape all URLs using TimesJobs scraper
    if state["urls"] and not state.get("raw_data"):
        scraped_results = scrape_with_timesjobs(state["urls"])
        state["raw_data"] = scraped_results
        
        success_count = len([r for r in scraped_results if r["status"] == "success"])
        
        return {
            "messages": state["messages"] + [
                HumanMessage(content=f"TimesJobs scraping completed: {success_count} jobs scraped successfully")
            ],
            "urls": state["urls"],
            "raw_data": state["raw_data"]
        }
    
    return state

def extract_node(state: ScrapingState):
    """Node that extracts structured data from scraped content"""
    if state.get("raw_data"):
        # Process each scraped result
        new_structured_data = []
        
        for scraped_item in state["raw_data"]:
            if scraped_item["content_length"] > 0:
                # Since we already have structured data from TimesJobs scraper,
                # we can use it directly or enhance it with LLM
                if scraped_item.get("raw_job_data"):
                    # Use the already structured data
                    job_data = scraped_item["raw_job_data"]
                    structured_info = {
                        "job_title": job_data["title"],
                        "company": job_data["company"],
                        "location": job_data["location"],
                        "experience": job_data["experience"],
                        "skills": job_data["skills"],
                        "description": f"Job at {job_data['company']} in {job_data['location']} requiring {job_data['experience']} experience",
                        "salary": job_data["salary"],
                        "posted_date": "Not specified",  # TimesJobs mobile doesn't show dates clearly
                        "job_url": job_data["url"],
                        "source_portal": "TimesJobs",
                        "scraping_status": "success"
                    }
                    new_structured_data.append(structured_info)
                    print(f"✅ Using pre-structured data for: {job_data['title']}")
                else:
                    # Fallback to LLM extraction
                    extraction_response = extraction_chain.invoke({
                        "messages": [
                            HumanMessage(content=f"""EXTRACT JOB DATA FROM THIS CONTENT:

                            SOURCE URL: {scraped_item['url']}
                            SOURCE PORTAL: TimesJobs
                            CONTENT:
                            {scraped_item['content']}

                            RETURN ONLY VALID JSON:""")
                        ]
                    })
                    
                    # Parse JSON response
                    response_text = extraction_response.content.strip()
                    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if json_match:
                        try:
                            structured_info = json.loads(json_match.group())
                            structured_info["source_url"] = scraped_item['url']
                            structured_info["source_portal"] = "TimesJobs"
                            structured_info["scraping_status"] = "success"
                            new_structured_data.append(structured_info)
                            print(f"✅ LLM extracted data for: {structured_info.get('job_title', 'Unknown')}")
                        except json.JSONDecodeError as e:
                            print(f"❌ JSON parsing failed: {e}")
                            new_structured_data.append(extract_job_data_fallback(scraped_item['content'], scraped_item['url'], "TimesJobs"))
        
        state["structured_data"] = new_structured_data
        
        return {
            "messages": state["messages"] + [
                HumanMessage(content=f"Extracted structured data from {len(new_structured_data)} job postings")
            ],
            "structured_data": state["structured_data"]
        }
    
    return state

def extract_job_data_fallback(content: str, url: str, portal: str) -> dict:
    """Fallback extraction when LLM fails to return proper JSON"""
    # Basic pattern matching for common job data
    lines = content.split('\n')
    job_title = "Not specified"
    company = "Not specified"
    location = "Not specified"
    
    for line in lines:
        if line.startswith('Title:'):
            job_title = line.replace('Title:', '').strip()
        elif line.startswith('Company:'):
            company = line.replace('Company:', '').strip()
        elif line.startswith('Location:'):
            location = line.replace('Location:', '').strip()
    
    return {
        "job_title": job_title,
        "company": company,
        "location": location,
        "experience": "Not specified",
        "skills": [],
        "description": f"Extracted from {portal}. Content: {content[:200]}...",
        "salary": "Not specified",
        "posted_date": "Not specified",
        "job_url": url,
        "source_portal": portal,
        "scraping_status": "success",
        "extraction_method": "fallback"
    }

def validate_node(state: ScrapingState):
    """Node that validates the extracted data"""
    if state.get("structured_data"):
        # Count valid vs invalid entries
        valid_entries = [job for job in state["structured_data"] if job.get("job_title") not in ["Extraction Failed", "No jobs found", "Not specified"]]
        
        validation_response = validation_chain.invoke({
            "messages": state["messages"] + [
                HumanMessage(content=f"""Validate these {len(state['structured_data'])} job records from TimesJobs. 
                {len(valid_entries)} appear to be valid, {len(state['structured_data']) - len(valid_entries)} need review.

Records: {json.dumps(state['structured_data'][:3], indent=2)}""")  # Show first 3 for validation
            ]
        })
        
        return {
            "messages": state["messages"] + [validation_response]
        }
    
    return state

def save_node(state: ScrapingState):
    """Node that saves data to structured format"""
    if state.get("structured_data"):
        timestamp = pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")
        
        # Filter out failed extractions
        valid_data = [job for job in state["structured_data"] if job.get("job_title") not in ["Extraction Failed", "No jobs found"]]
        
        # Save to JSON
        json_filename = f"job_data_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(valid_data, f, indent=2, ensure_ascii=False)
        
        # Save to CSV
        csv_filename = f"job_data_{timestamp}.csv"
        try:
            # Flatten the data for CSV
            flat_data = []
            for job in valid_data:
                flat_job = job.copy()
                flat_job['skills'] = ', '.join(flat_job.get('skills', []))
                flat_data.append(flat_job)
            
            df = pd.DataFrame(flat_data)
            df.to_csv(csv_filename, index=False, encoding='utf-8')
        except Exception as e:
            print(f"⚠️ Could not create CSV: {e}")
            csv_filename = None
        
        save_message = f"✅ Saved {len(valid_data)} valid job records to {json_filename}"
        if csv_filename:
            save_message += f" and {csv_filename}"
        
        print(f"📊 Saved {len(valid_data)} valid job records (filtered from {len(state['structured_data'])} total)")
        
        return {
            "messages": state["messages"] + [HumanMessage(content=save_message)]
        }
    
    return state

# Create chains
scraping_chain = scraping_prompt | llm
extraction_chain = extraction_prompt | llm
validation_chain = validation_prompt | llm

# Build graph
graph_builder.add_node(SCRAPE, scrape_node)
graph_builder.add_node(EXTRACT, extract_node)
graph_builder.add_node(VALIDATE, validate_node)
graph_builder.add_node(SAVE, save_node)

graph_builder.set_entry_point(SCRAPE)

def should_continue(state: ScrapingState):
    """Decide the next step in the workflow"""
    if state.get("urls") and not state.get("raw_data"):
        return SCRAPE  # Need to scrape
    elif state.get("raw_data") and not state.get("structured_data"):
        return EXTRACT  # Need to extract structured data
    elif state.get("structured_data"):
        ai_messages = [msg for msg in state["messages"] if isinstance(msg, AIMessage)]
        if len(ai_messages) < len(state["structured_data"]) + 1:
            return VALIDATE  # Validate the data
        else:
            return SAVE  # Save and finish
    return END

graph_builder.add_conditional_edges(
    SCRAPE, 
    should_continue,
    {
        SCRAPE: SCRAPE,
        EXTRACT: EXTRACT,
        VALIDATE: VALIDATE, 
        SAVE: SAVE,
        END: END
    }
)

graph_builder.add_edge(EXTRACT, VALIDATE)
graph_builder.add_edge(VALIDATE, SAVE)
graph_builder.add_edge(SAVE, END)

app = graph_builder.compile()

# Test the enhanced system
if __name__ == "__main__":
    print("🚀 Enhanced TimesJobs Scraping Agent")
    print("=" * 60)
    
    initial_state = {
        "messages": [
            HumanMessage(content="Find Python developer jobs on TimesJobs")
        ],
        "urls": [],
        "raw_data": [],
        "structured_data": []
    }
    
    print("Starting TimesJobs scraping workflow...")
    for event in app.stream(initial_state):
        for node, value in event.items():
            if value.get('messages'):
                last_msg = value['messages'][-1]
                print(f"🟢 {node.upper()}: {last_msg.content[:100]}...")
    
    print("\n✅ Workflow completed!")