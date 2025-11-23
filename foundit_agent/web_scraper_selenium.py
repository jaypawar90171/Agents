# web_scraper_selenium.py
import csv
import time
import random
from typing import List, Dict

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

def setup_driver():
    options = Options()
    # options.add_argument("--headless")  # Uncomment if you want no browser window
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/110.0.0.0 Safari/537.36")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    # Hide webdriver flag
    try:
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            })
            """
        })
    except Exception:
        pass
    return driver

def scrape_foundit_paginated(keyword: str, location: str = None, max_pages: int = 5) -> List[Dict[str, str]]:
    """
    Returns a list of dicts: {'Job Title': ..., 'Link': ...}
    """
    driver = setup_driver()
    jobs_data = []

    base_url = "https://www.foundit.in/search/"
    query_part = f"{keyword}-jobs"
    if location:
        query_part += f"-in-{location}"
    query_part = query_part.replace(" ", "-")
    url = f"{base_url}{query_part}"

    print(f"Starting scraper for: {url}")

    try:
        driver.get(url)
        time.sleep(2)
        current_page = 1
        while current_page <= max_pages:
            try:
                WebDriverWait(driver, 20).until(
                    EC.presence_of_element_located((By.XPATH,
                        "//div[contains(@class, 'srpResultCard')] | "
                        "//div[contains(@class, 'cardContainer')] | "
                        "//div[contains(@class, 'job-card')] | "
                        "//div[contains(@id, 'srp-jobList')]"
                    ))
                )
            except Exception as e:
                print("Timeout waiting for job cards or no results on this page.")
                break

            # scroll a bit to load content
            for _ in range(2):
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1.2)

            job_cards = driver.find_elements(By.XPATH,
                "//div[contains(@class, 'srpResultCard')] | "
                "//div[contains(@class, 'cardContainer')] | "
                "//div[contains(@class, 'job-card')]"
            )
            if not job_cards:
                job_cards = driver.find_elements(By.XPATH, "//div[@id='srp-jobList']//div[contains(@class, 'card')]")

            for card in job_cards:
                title = "N/A"
                link = "N/A"
                try:
                    # title attempts
                    try:
                        title_elem = card.find_element(By.XPATH,
                            ".//div[contains(@class, 'jobTitle')] | .//h3 | .//div[contains(@class, 'title')] | .//a[contains(@class, 'title')] | .//div[contains(@class, 'header')]//a"
                        )
                        title = title_elem.text.strip()
                    except Exception:
                        try:
                            first_link = card.find_element(By.TAG_NAME, "a")
                            if len(first_link.text) > 2:
                                title = first_link.text.strip()
                        except Exception:
                            pass

                    try:
                        link_elem = card.find_element(By.TAG_NAME, "a")
                        link = link_elem.get_attribute("href") or "N/A"
                    except Exception:
                        pass

                    if title != "N/A" or link != "N/A":
                        jobs_data.append({"Job Title": title, "Link": link})
                except Exception:
                    continue

            # pagination: try clicking page number
            next_page_num = current_page + 1
            try:
                page_btn_xpath = f"//*[self::button or self::a][normalize-space(text())='{next_page_num}']"
                btn = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, page_btn_xpath))
                )
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                time.sleep(0.6)
                btn.click()
                time.sleep(random.uniform(1.5, 3.0))
                current_page += 1
            except Exception:
                # If can't find numeric button, try clicking a "Next" button
                try:
                    next_btn = driver.find_element(By.XPATH, "//a[contains(text(),'Next') or contains(text(),'next') or contains(@aria-label,'Next')]")
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", next_btn)
                    time.sleep(0.6)
                    next_btn.click()
                    time.sleep(random.uniform(1.5, 3.0))
                    current_page += 1
                except Exception:
                    break

        return jobs_data
    finally:
        driver.quit()
