# foundit_scrapper2.py
import csv
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Union

def scrape_foundit(csv_path: str = './foundit_jobs.csv',
                   output_path: str = 'output.txt',
                   url_column: int = 1,
                   encoding: str = 'utf-8',
                   timeout: int = 10,
                   urls: Optional[Union[List[str], tuple]] = None) -> List[Dict[str, str]]:
    """
    Read CSV (if urls not provided), fetch each URL, extract text from
    <div class="break-words"> (common on foundit job pages), append to output file.
    Returns a list of dicts: {'url': ..., 'content': ...}
    """
    results = []

    url_list = []
    if urls:
        # If a list/tuple of URLs was passed directly, use it
        url_list = list(urls)
    else:
        # Read CSV to get URL column
        try:
            with open(csv_path, 'r', newline='', encoding=encoding) as csvfile:
                reader = csv.reader(csvfile)
                try:
                    headers = next(reader)
                except StopIteration:
                    return results
                for row in reader:
                    try:
                        url = row[url_column]
                        if url:
                            url_list.append(url)
                    except IndexError:
                        continue
        except FileNotFoundError:
            # no CSV and no urls -> return empty list
            return results

    # Now fetch each URL
    for url in url_list:
        content = ""
        try:
            response = requests.get(url, timeout=timeout, headers={"User-Agent":"Mozilla/5.0"})
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            div = soup.find('div', class_="break-words")
            if div:
                content = div.get_text(separator=' ', strip=True)
            else:
                # fallback: grab main article text heuristics
                article = soup.find('article')
                if article:
                    content = article.get_text(separator=' ', strip=True)
                else:
                    # as last resort, grab body text
                    content = soup.body.get_text(separator=' ', strip=True) if soup.body else ""
        except Exception:
            content = ""

        results.append({'url': url, 'content': content})

    # Append results to output file for later use
    if results:
        try:
            with open(output_path, 'a', encoding=encoding) as outf:
                for item in results:
                    outf.write(item['content'] + "\n")
        except Exception:
            pass

    return results

if __name__ == "__main__":
    # quick test: will attempt to read ./foundit_jobs.csv
    print(scrape_foundit())
