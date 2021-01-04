#!/usr/bin/env python3
"""
Convert arXiv code into markdown entry for webpage in Hugo academic theme
=========================================================================

Main usuage e.g.,

>>> markdown('1607.06608')

to scrape https://arxiv.org/abs/1607.06608 into a publication for Hugo
academic theme.
"""

import requests
import datetime
import collections
import sys
import re

from lxml import html


URL_DOI = "http://dx.doi.org/{}"
URL_ARXIV = "https://arxiv.org/abs/{}"
DATE_ARXIV = "%d %b %Y"
DATE_MD = "%Y-%m-%d"
FETCH = collections.namedtuple('arXiv', 'date title authors abstract url_pdf url_doi')


TEMPLATE = """
+++
abstract = {abstract}
abstract_short = ""
authors = {authors}
date = {date}
image_preview = ""
math = true
publication_types = ["2"]
publication = ""
publication_short = ""
featured = false
title = {title}
url_code = ""
url_dataset = ""
url_pdf = {url_pdf}
url_project = ""
url_slides = ""
url_video = ""
doi = {url_doi}
+++
"""


def wrap_quote(item):
    """
    :returns: Argument strippted of trailing spaces and wrapped in quotation marks
    """
    return '"{}"'.format(str(item).strip())

def parse_date(date):
    """
    :returns: Date in format for Hugo academic theme
    """
    prefix = '[Submitted on'
    date = date.strip()
    date = date[len(prefix):].strip("[] ")
    date = datetime.datetime.strptime(date, DATE_ARXIV).strftime(DATE_MD)
    return wrap_quote(date)

def parse_author(author):
    """
    :returns: Author in format Firstname Lastname
    """
    names = author.split(",")
    names = [n.strip() for n in names]
    author = r"{} {}".format(*names[::-1])
    return author

def parse_tex(tex):
    """
    :returns: LaTeX code but with special characters escaped for markdown
    """
    tex = re.sub("\\\\", "\\\\\\\\", tex)
    tex = re.sub("_", "\\\\\\\\_", tex)
    tex = re.sub("\n", " ", tex)
    return wrap_quote(tex)

def parse_doi(url_doi):
    """
    :returns: URL for DOI, if there is one
    """
    if url_doi:
        return wrap_quote(URL_DOI.format(url_doi.strip()))
    else:
        return '""'

def fetch_raw(code):
    """
    :param code: arXiv code, e.g. 1607.06608
    :returns: Data scraped from arXiv page
    """
    url_arxiv = URL_ARXIV.format(code)
    page = requests.get(url_arxiv)
    tree = html.fromstring(page.content)

    date = tree.xpath('//div[@class="dateline"]/text()')[0]
    title = tree.xpath('//h1[@class="title mathjax"]/text()')[0]
    abstract = tree.xpath('//blockquote[@class="abstract mathjax"]/text()')[-1]
    url_pdf = tree.xpath('//meta[@name="citation_pdf_url"]')[0].items()[1][1]
    authors = [a.items()[1][1] for a in tree.xpath('//meta[@name="citation_author"]')]

    try:
        url_doi = tree.xpath('//meta[@name="citation_doi"]')[0].items()[1][1]
    except IndexError:
        url_doi = ""

    return FETCH(date, title, authors, abstract, url_pdf, url_doi)

def fetch_markdown(code):
    """
    :param code: arXiv code, e.g. 1607.06608
    :returns: Data scraped from arXiv page in markdown format
    """
    data = fetch_raw(code)

    date = parse_date(data.date)
    title = parse_tex(data.title)
    authors = str([parse_author(a) for a in data.authors])
    abstract = parse_tex(data.abstract)
    url_pdf = wrap_quote(data.url_pdf)
    url_doi = parse_doi(data.url_doi)

    return FETCH(date, title, authors, abstract, url_pdf, url_doi)

def markdown(code):
    """
    :param code: arXiv code, e.g. 1607.06608
    :returns: Markdown entry for publication in Hugo academic theme
    """
    data = fetch_markdown(code)
    return TEMPLATE.format(**data._asdict())

if __name__ == "__main__":

    code = sys.argv[1]
    print(markdown(code))
