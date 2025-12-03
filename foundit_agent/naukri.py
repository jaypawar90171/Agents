import re, json, time, random, os
from typing import List, Dict, Any
from datetime import datetime
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService
from pydantic import BaseModel, Field
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_groq import ChatGroq
from dotenv import load_dotenv
load_dotenv()

# CONFIG
HEADLESS = False
KEYWORD = "python developer"
LOCATION = "bangalore"
MAX_PAGES = 1
OUTPUT_FILE = "naukri_pipeline_only_output.jsonl"
LLM_INPUT_CHARS = 3000

# LLM schema (keeps parser consistent if used)
class JobPosting(BaseModel):
    skills_required: List[str] = Field(description="List of skills")
    job_description_summary: str = Field(description="Short summary")

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.0, max_tokens=512)
parser = JsonOutputParser(pydantic_object=JobPosting)

# Minimal utils
def make_driver(headless=HEADLESS):
    opts = Options()
    if headless:
        opts.add_argument("--headless=new"); opts.add_argument("--disable-gpu"); opts.add_argument("--no-sandbox")
    else:
        opts.add_argument("--start-maximized")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument(f"--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/{random.randint(100,140)}.0.0.0 Safari/537.36")
    opts.add_experimental_option("excludeSwitches", ["enable-automation","enable-logging"])
    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=opts)
    try: driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    except: pass
    return driver

def build_search(keyword, location, page):
    k = keyword.replace(" ", "-"); base = f"https://www.naukri.com/{k}-jobs"
    params = []
    if location: params.append(f"l={location.replace(' ', '%20')}")
    if page>1: params.append(f"page={page}")
    return base + ("?" + "&".join(params) if params else "")

def close_popups(d):
    for sel in ["button[class*='close']","span[class*='cross']",".popup-close",".regClose","button[aria-label='Close']"]:
        try:
            for e in d.find_elements(By.CSS_SELECTOR, sel):
                if e.is_displayed(): d.execute_script("arguments[0].click();", e); time.sleep(0.08)
        except: pass

def split_clean(s):
    parts = re.split(r"[,\|\;/•·]| and | & ", s)
    return [p.strip().strip(".,;:-•·") for p in parts if 1 < len(p.strip()) <= 120]

def looks_noise(tok, company, title):
    s=tok.lower()
    if any(w in s for w in ("save","apply","posted","review","yrs","years","lacs","pa","remote","hybrid","job","jobs","today","yesterday")): return True
    if re.search(r"[₹$]|lacs?|inr|\bpa\b", s): return True
    if re.fullmatch(r"[\d\-\.\,]+", s): return True
    if any(loc in s for loc in ("bengaluru","bangalore","hyderabad","chennai","mumbai","pune","gurgaon","noida","delhi")): return True
    comp = re.sub(r"[^a-z0-9 ]"," ", (company or "").lower()); tit = re.sub(r"[^a-z0-9 ]"," ", (title or "").lower())
    for w in (comp + " " + tit).split():
        if len(w)>2 and w in s: return True
    if len(s.split())>5: return True
    if not re.search(r"[a-zA-Z]", s): return True
    return False

def normalize(tok):
    tok = tok.strip()
    if re.fullmatch(r"[A-Za-z0-9\+\#]{1,6}", tok): return tok.upper()
    return " ".join([w.upper() if len(w)<=2 else w.title() for w in tok.split()])

def extract_skills_from_card_html(card_html: str, company: str = "", title: str = "") -> List[str]:
    soup = BeautifulSoup(card_html, "html.parser")
    candidates=[]
    for sel in ["[class*='skill']","[class*='tag']","[class*='chip']","[class*='pill']",".tags",".skillTags",".srpSkill",".keySkills",".skills"]:
        for el in soup.select(sel):
            t=el.get_text(" ",strip=True); 
            if t: candidates += split_clean(t)
    for li in soup.find_all("li"): candidates += split_clean(li.get_text(" ",strip=True))
    for el in soup.select("span,a"):
        t=el.get_text(" ",strip=True)
        if t and len(t.split())<=6: candidates += split_clean(t)
    text = soup.get_text(" ",strip=True)
    for m in re.finditer(r"(?:skills|required skills|key skills|technical skills|skillset)\s*[:\-–]\s*([A-Za-z0-9\,\.\|\;/\s\+&\-]{2,300})", text, flags=re.I):
        candidates += split_clean(m.group(1))
    out=[]; seen=set()
    for c in candidates:
        c2=c.strip()
        if not c2 or looks_noise(c2, company, title): continue
        if c2.lower() in seen: continue
        seen.add(c2.lower()); out.append(normalize(c2))
    return out

def extract_job_description_from_card(card_html: str) -> str:
    soup = BeautifulSoup(card_html, "html.parser")
    parts=[]
    for sel in [".job-description",".job-desc",".desc",".description",".info",".text",".summary",".jobTupleDesc",".jd"]:
        el=soup.select_one(sel)
        if el:
            txt=el.get_text(" ",strip=True)
            if txt and len(txt)>20: parts.append(txt)
    paras=[p.get_text(" ",strip=True) for p in soup.find_all("p") if p.get_text(" ",strip=True)]
    parts += [p for p in paras if len(p)>20]
    joined=" ".join(parts).strip()
    if not joined: joined = re.sub(r"\s{2,}", " ", soup.get_text(" ",strip=True))[:1200]
    return joined

def llm_summary_from_text(text_for_llm: str) -> str:
    if not text_for_llm: return ""
    prompt = PromptTemplate(template=f"You are an expert job-data extraction assistant. Output exactly JSON as: {parser.get_format_instructions()}\n\nJob Text:\n{{context}}", input_variables=["context"])
    chain = prompt | llm | parser
    try:
        res = chain.invoke({"context": text_for_llm})
        return (res.get("job_description_summary") if isinstance(res, dict) else "") or ""
    except Exception:
        return ""

# PIPELINE NODES
def collect_cards(driver, keyword: str, location: str, max_pages: int) -> List[Dict[str,Any]]:
    cards=[]
    for p in range(1, max_pages+1):
        url = build_search(keyword, location, p)
        try:
            driver.get(url)
        except Exception as e:
            print("[collect] driver.get err", e); continue
        time.sleep(random.uniform(1.5,3.0)); close_popups(driver)
        try:
            WebDriverWait(driver, 6).until(EC.presence_of_element_located((By.CSS_SELECTOR, ".jobTuple, article, [data-job-id], .list, .tuple")))
        except TimeoutException: pass
        for _ in range(2):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);"); time.sleep(0.6)
        soup = BeautifulSoup(driver.page_source, "html.parser")
        containers = soup.select(".jobTuple, article, [data-job-id], .tuple, .list")
        for c in containers:
            try:
                a = c.select_one("a.title, a[href][data-tn-link], a[href].title, a[href]")
                title = a.get_text(" ",strip=True) if a else c.get_text(" ",strip=True)[:120]
                href = a.get("href") if a and a.has_attr("href") else ""
                if href and not href.startswith("http"): href = "https://www.naukri.com" + href
                comp_el = c.select_one(".comp-name, .company, .subTitle")
                company = comp_el.get_text(" ",strip=True) if comp_el else ""
                snippet_el = c.select_one(".job-description, .desc, .info, .text, .summary")
                snippet = snippet_el.get_text(" ",strip=True) if snippet_el else re.sub(r"\s+"," ",c.get_text(" ",strip=True))[:180]
                card_html = str(c)
                job_description = extract_job_description_from_card(card_html)
                cards.append({"job_title": title, "job_url": href, "company": company, "card_html": card_html, "card_snippet": snippet, "job_description": job_description})
            except Exception:
                continue
        time.sleep(random.uniform(1.5,3.0))
    # dedupe
    dedup=[]; seen=set()
    for r in cards:
        key = (r.get("job_url") or "").rstrip("/") or (r.get("job_title","")+"|"+r.get("company",""))
        if key and key not in seen: seen.add(key); dedup.append(r)
    return dedup

def process_card(card: Dict[str,Any]) -> Dict[str,Any]:
    title = card.get("job_title",""); company = card.get("company","")
    html = card.get("card_html",""); snippet = card.get("card_snippet",""); job_desc = card.get("job_description","")
    skills = extract_skills_from_card_html(html, company=company, title=title)
    if not skills:
        text = job_desc or snippet or BeautifulSoup(html,"html.parser").get_text(" ",strip=True)
        for ln in text.splitlines():
            if "skill" in ln.lower() or 1<=ln.count(",")<=8:
                for t in split_clean(ln):
                    if not looks_noise(t, company, title): skills.append(normalize(t))
        skills = list(dict.fromkeys(skills))
    summary = llm_summary_from_text((job_desc or snippet)[:LLM_INPUT_CHARS]) or ((job_desc or snippet)[:800])
    return {"job_title": title, "job_url": card.get("job_url",""), "company": company, "skills_required": skills, "job_description_summary": summary, "job_description": job_desc, "scraped_at": datetime.now().isoformat()}

# RUNNER
def run_pipeline(keyword=KEYWORD, location=LOCATION, max_pages=MAX_PAGES, headless=HEADLESS, output_file=OUTPUT_FILE):
    driver=None
    try:
        driver = make_driver(headless)
        cards = collect_cards(driver, keyword, location, max_pages)
        with open(output_file, "a", encoding="utf-8") as fout:
            for i,c in enumerate(cards):
                out = process_card(c)
                fout.write(json.dumps(out, ensure_ascii=False) + "\n")
                print(f"[saved] {i+1}/{len(cards)} skills:{len(out['skills_required'])} title:{out['job_title'][:60]}")
                time.sleep(random.uniform(0.6,1.4))
    finally:
        if driver:
            try: driver.quit()
            except: pass

if __name__ == "__main__":
    run_pipeline()
