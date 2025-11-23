import csv
import time
import random

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

def setup_driver():
    options = Options()
    # options.add_argument("--headless")  # Uncomment to run without opening a window
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/110.0.0.0 Safari/537.36")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": """
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        })
        """
    })
    return driver

def scrape_foundit_paginated(keyword, location=None, max_pages=5):
    driver = setup_driver()
    jobs_data = []

    # Build URL as in your original code
    base_url = "https://www.foundit.in/search/"
    query_part = f"{keyword}-jobs"
    if location:
        query_part += f"-in-{location}"
    query_part = query_part.replace(" ", "-")
    url = f"{base_url}{query_part}"

    print(f"🚀 Starting scraper for: {url}")

    try:
        driver.get(url)
        time.sleep(3)
        print(f"📄 Page Title: {driver.title}")

        current_page = 1
        while current_page <= max_pages:
            print(f"⏳ Waiting for jobs to load on page {current_page}...")
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
                print("⚠️ Timeout waiting for job cards.")
                driver.save_screenshot(f"debug_error_page_{current_page}.png")
                break

            print("📜 Scrolling to load results...")
            for _ in range(3):
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)

            # --- SELECTORS ---
            job_cards = driver.find_elements(By.XPATH,
                "//div[contains(@class, 'srpResultCard')] | "
                "//div[contains(@class, 'cardContainer')] | "
                "//div[contains(@class, 'job-card')]"
            )
            if not job_cards:
                print("⚠️ No job cards found. Trying alternative selector...")
                job_cards = driver.find_elements(By.XPATH, "//div[@id='srp-jobList']//div[contains(@class, 'card')]")
            print(f"🔍 Found {len(job_cards)} job cards on page {current_page}. Extracting data...")

            for i, card in enumerate(job_cards):
                try:
                    title = "N/A"
                    try:
                        title_elem = card.find_element(By.XPATH,
                            ".//div[contains(@class, 'jobTitle')] | "
                            ".//h3 | "
                            ".//div[contains(@class, 'title')] | "
                            ".//a[contains(@class, 'title')] | "
                            ".//div[contains(@class, 'header')]//a"
                        )
                        title = title_elem.text.strip()
                    except:
                        try:
                            first_link = card.find_element(By.TAG_NAME, "a")
                            if len(first_link.text) > 5:
                                title = first_link.text.strip()
                        except:
                            pass

                    link = "N/A"
                    try:
                        link_elem = card.find_element(By.TAG_NAME, "a")
                        link = link_elem.get_attribute("href")
                    except:
                        pass

                    if title != "N/A":
                        jobs_data.append({
                            "Job Title": title,
                            "Link": link
                        })
                        print(f" ✅ Scraped: {title[:30]}")
                except Exception as e:
                    continue

            # --- PAGINATION BUTTON LOGIC ---
            next_page_num = current_page + 1
            try:
                # Pagination button selector (numbered, not "Next")
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

        print(f"Total jobs scraped: {len(jobs_data)}")
        return jobs_data
    finally:
        driver.quit()
        print("👋 Driver closed.")

def save_to_csv(data, filename="foundit_jobs.csv"):
    if not data:
        print("⚠️ No data to save.")
        return
    keys = data[0].keys()
    with open(filename, 'w', newline='', encoding='utf-8') as output_file:
        dict_writer = csv.DictWriter(output_file, fieldnames=keys)
        dict_writer.writeheader()
        dict_writer.writerows(data)
    print(f"💾 Data saved to {filename}")

if __name__ == "__main__":
    KEYWORD = "python"
    LOCATION = "bangalore"
    print(f"🔎 Looking for '{KEYWORD}' jobs in '{LOCATION}'...")
    results = scrape_foundit_paginated(KEYWORD, LOCATION, max_pages=5)
    save_to_csv(results)
