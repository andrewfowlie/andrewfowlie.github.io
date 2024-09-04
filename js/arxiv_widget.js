// JavaScript widget to display list of articles associated with an
// arXiv author id. See http://arxiv.org/help/myarticles
//
// Based on code copyright (C) 2009-2011 arXiv.org
// and released under GNU GPL. 

// Customized by Willie WY Wong
// Modified by Andrew Fowlie

var authorID = ["fowlie_a_1"]
var articleHtml = {};
var n_authors = authorID.length;
var n_processed = 0;
var showAltmetric = 1;

processAuthorID();


function processAuthorID() {
    for (let i = 0; i < authorID.length; i++) {
        json2Html(authorID[i]);
    }
}

// https://stackoverflow.com/a/43733087/2855071
function setHTML(o, html, clear) {
    if (clear) o.innerHTML = "";

    // Generate a parseable object with the html:
    var dv = document.createElement("div");
    dv.innerHTML = html;

    // Handle edge case where innerHTML contains no tags, just text:
    if (dv.children.length === 0) {
        o.innerHTML = html;
        return;
    }

    for (var i = 0; i < dv.children.length; i++) {
        var c = dv.children[i];

        // n: new node with the same type as c
        var n = document.createElement(c.nodeName);

        // copy all attributes from c to n
        for (var j = 0; j < c.attributes.length; j++)
            n.setAttribute(c.attributes[j].nodeName, c.attributes[j].nodeValue);

        // If current node is a leaf, just copy the appropriate property (text or innerHTML)
        if (c.children.length == 0) {
            switch (c.nodeName) {
                case "SCRIPT":
                    if (c.text) n.text = c.text;
                    break;
                default:
                    if (c.innerHTML) n.innerHTML = c.innerHTML;
                    break;
            }
        }
        // If current node has sub nodes, call itself recursively:
        else setHTML(n, c.innerHTML, false);
        o.appendChild(n);
    }
}

function setHtml(articleHtml) {

    let html = '';

    if (showAltmetric) {
        html += '<script type="text/javascript" src="https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js"></script>'
    }

    html += '<div id="arxivcontainer">\n';
    let thisYear = 0;
    let thisMonth = 0;
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    let dates = dateSort(Object.keys(articleHtml));

    for (let i = 0; i < dates.length; i++) {

        if (maxArticles > 0 && i >= maxArticles) {
            break;
        }

        let d = new Date(dates[i]);
        let year = d.getFullYear();
        let month = d.getMonth();

        if (showDates && (year != thisYear || month != thisMonth)) {
            thisYear = year;
            thisMonth = month;
            html += '<h5 class="mb-0">' + thisYear + '&nbsp' + months[thisMonth] + '</h5><hr style="height:0px; visibility:hidden;"/>';
        }

        html += articleHtml[dates[i]];
    }

    html += '</div>\n';

    // Link for all papers

    if (showLinkAll) {
        url = 'preprints';
        html += '<div class="see-all"><a href=' + url + '>';
        html += '    SEE ALL PREPRINTS';
        html += '<i class="fas fa-angle-right"></i></a></div>';
    }

    setHTML(document.getElementById('arxivfeed'), html, true)

    MathJax.typesetPromise();
}

function dateSort(obj) {
    return obj.sort((a, b) => new Date(b) - new Date(a));
}

function json2Html(arxiv_authorid) {
    let headID = document.getElementsByTagName("head")[0];
    let newScript = document.createElement('script');
    let urlPrefix = 'https://arxiv.org/a/';
    newScript.type = 'text/javascript';
    newScript.src = urlPrefix + arxiv_authorid + '.js';
    headID.appendChild(newScript);
}

// https://stackoverflow.com/a/48151864/2855071
function escapeHtml(str) {
    var div = document.createElement('div');
    var text = document.createTextNode(str);
    div.appendChild(text);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// https://stackoverflow.com/a/1500501/2855071
function addUrl(str) {
    let urlRegex = /(https?:\/\/\S*[^.])/g;
    str = str.replace(urlRegex, '<a href="$1">$1</a>');
    urlRegex = /(\d\d\d\d\.\d\d\d\d\d)/g;
    str = str.replace(urlRegex, '<a href="https://arxiv.org/abs/$1">$1</a>');
    return str;
}

function parseAuthors(authors) {
    let maxAuthors = 5;
    let authorSplit = authors.split(",");
    let nAuthors = authorSplit.length;
    if (nAuthors <= maxAuthors) return authors;
    return authorSplit.slice(0, maxAuthors).join() + " et al";
}

function jsonarXivFeed(feed) {
    for (let i = 0; i < feed.entries.length; i++) {

        // Don't do more than we will need
        if (maxArticles > 0 && i >= maxArticles) {
            break;
        }

        let snippet = feed.entries[i];
        let id = snippet.id.split('/')[4].split('v')[0];

        let html = '<div class="card experience course" style="width:80%">\n<div class="card-body" style="width:100%">';
        html += '<h4 class="card-title exp-title my-0"><a href=' + snippet.id + '>[' + id + '] ' + snippet.title + '</a></h4>\n';

        if (showAltmetric != 0) {
            html += '<div class="card-subtitle article-metadata my-1"><div class="altmetric-embed" data-badge-popover="bottom" data-badge-type="3" data-hide-no-mentions="true" data-arxiv-id="' + id + '"></div></div>\n';
        }

        html += '<div class="card-subtitle article-metadata my-1">' + parseAuthors(snippet.authors) + '</div>\n';

        let hasJref = (snippet.journal_ref && snippet.journal_ref.length > 1);
        let hasDoi = (snippet.doi && snippet.doi.length > 0);

        if (hasDoi || hasJref) {
            html += '<div class="card-subtitle article-metadata my-0">'
            if (hasJref) {
                html += '<a href="http://dx.doi.org/' + snippet.doi + '">' + snippet.journal_ref + '</a>';
            } else {
                html += '<a href="http://dx.doi.org/' + snippet.doi + '">' + snippet.doi + '</a>';
            }
            html += '</div>\n';
        }

        // Now put in the summary
        if (showAbstract != 0) {
            html += '<div class="card-text">' + addUrl(escapeHtml(snippet.summary)) + '</div>\n';
        }

        html += '</div>\n </div>\n';
        articleHtml[snippet.published] = html;
    }

    // Only do this once at end
    n_processed += 1;
    if (n_processed == n_authors) {
        setHtml(articleHtml);
    }
}
