/******************************************************
 * server.js (ESM + Puppeteer + Axios + Cheerio)
 * -----------------------------------------------
 * This file starts an Express server that scrapes
 * multiple websites. We use:
 *  - Puppeteer for advanced scraping (SeLoger),
 *  - Axios + Cheerio for simpler pages (French-Property, etc.).
 * 
 * Usage:
 *  1) In your package.json, set `"type": "module"`.
 *  2) Install:
 *     npm install express cors puppeteer axios cheerio
 *  3) Run:
 *     node server.js
 ******************************************************/

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { load } from 'cheerio';
import puppeteer from 'puppeteer'; // Puppeteer for headless browser

// Create the Express app & enable CORS
const app = express();
app.use(cors());

// Choose the port for the server
const PORT = process.env.PORT || 4000;

/******************************************************
 * scrapeFrenchProperty()
 * ----------------------------------------------------
 * Example scraping function using Axios + Cheerio to
 * get data from French-Property.com.
 ******************************************************/
async function scrapeFrenchProperty() {
    // The URL you want to scrape
    const url =
        'https://www.french-property.com/properties-for-sale?sort_by=date&sort_direction=desc&page_size=50';

    // 1) Fetch the HTML via Axios
    const response = await axios.get(url);
    const html = response.data;

    // 2) Load the HTML into Cheerio
    const $ = load(html);

    // 3) We'll store the final property objects here
    const properties = [];

    // 4) Parse the DOM
    $('.main_search').each((_, el) => {
        // Within .main_search, find .properties
        $(el).find('.properties').each((_, el2) => {
            // Each .properties contains multiple .property_listing
            $(el2).find('.property_listing').each((_, propEl) => {
                /****************************************
                 *  A) Collect array of images
                 ****************************************/
                const imageArray = [];
                // "li[itemprop='image']" might contain <img> or <meta>
                $(propEl)
                    .find("li[itemprop='image']")
                    .each((_, liEl) => {
                        const imgTag = $(liEl).find('img.lazyload');
                        // Prefer data-src if present, else fallback to src
                        const dataSrc = imgTag.attr('data-src')?.trim() ?? '';
                        const src = imgTag.attr('src')?.trim() ?? '';
                        const metaFullSize =
                            $(liEl)
                                .find('meta[itemprop="contentUrl"]')
                                .attr('content')
                                ?.trim() ?? '';

                        if (dataSrc) {
                            imageArray.push(dataSrc);
                        } else if (src) {
                            imageArray.push(src);
                        }
                        if (metaFullSize) {
                            imageArray.push(metaFullSize);
                        }
                    });

                /****************************************
                 *  B) Grab mainImage (src or link)
                 ****************************************/
                const mainImageLink =
                    $(propEl).find('a.main_image').attr('href')?.trim() ?? '';
                const mainImageSrc =
                    $(propEl).find('img.lazyload').attr('data-src')?.trim() ?? '';
                const mainImage = mainImageLink || mainImageSrc;

                /****************************************
                 *  C) Anchor info (text, href, title)
                 ****************************************/
                // If <a rel="nofollow"> is the main property link
                const anchorEl = $(propEl).find('a[rel="nofollow"]');
                const linkText = anchorEl.text().trim();
                const linkHref = anchorEl.attr('href')?.trim() ?? '';
                const linkTitle = anchorEl.attr('title')?.trim() ?? '';

                // If link is relative, prepend domain
                const fullLink = linkHref.startsWith('/')
                    ? `https://www.french-property.com${linkHref}`
                    : linkHref;

                /****************************************
                 *  D) Other fields: name, description, price...
                 ****************************************/
                const name = $(propEl).find('h3').attr('name')?.trim() ?? '';
                const description = $(propEl).find('.description').text().trim();
                const location_map = $(propEl).find('.location_map').text().trim();
                const location = $(propEl).find('.location_full').text().trim();
                const location_details = $(propEl).find('.location_details').text().trim();
                const price = $(propEl).find('.price').text().trim();
                const info_beds = $(propEl).find('.info-beds').text().trim();
                const info_bath = $(propEl).find('.info-bath').text().trim();
                const info_habitable = $(propEl).find('.info-habitable').text().trim();
                const info_land = $(propEl).find('.info-land').text().trim();
                const ref = $(propEl).find('.ref').text().trim();

                /****************************************
                 *  E) Push the property object
                 ****************************************/
                properties.push({
                    site: 'French-Property.com',
                    images: imageArray,
                    main_image: mainImage,

                    // Anchor fields
                    linkText,
                    linkHref,
                    linkTitle,
                    link: `https://www.french-property.com${linkHref}`,

                    // Other fields
                    location_map,
                    info_beds,
                    info_bath,
                    info_habitable,
                    info_land,
                    description,
                    location_details,
                    ref,
                    location,
                    price,
                });
            });
        });
    });

    // Return the array of property objects
    return properties;
}

/******************************************************
 * scrapeSeLoger()
 * ----------------------------------------------------
 * Example scraping function using Puppeteer to open
 * the SeLoger page with a headless browser. Then we
 * parse the returned HTML with Cheerio for consistency.
 ******************************************************/
async function scrapeSeLoger() {
    // The URL you want to scrape from SeLoger
    const url =
        'https://www.seloger.com/list.htm?projects=2,5&types=2,1&natures=1,2,4&places=[{%22divisions%22:[2238]}]&mandatorycommodities=0&enterprise=0&qsVersion=1.0&m=homepage_buy-redirection-search_results';
    // Launch Puppeteer with headless mode
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Set a realistic User-Agent to mimic a real browser
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/112.0.5615.121 Safari/537.36'
    );

    // Navigate to the target URL and wait until network is idle
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for the property cards to load. Increase timeout to 60 seconds.
    try {
        await page.waitForSelector('div[data-testid="sl.explore.card-container"]', { timeout: 60000 });
    } catch (error) {
        console.error("Timeout waiting for property cards. The page structure may have changed, or you might be blocked.", error);
        // Optionally, take a screenshot for debugging:
        // await page.screenshot({ path: 'debug-screenshot.png' });
        await browser.close();
        return []; // Return empty array if elements are not found
    }

    // Grab the rendered HTML
    const html = await page.content();
    await browser.close();

    // Load the HTML into Cheerio for parsing
    const $ = load(html);
    const properties = [];

    // Log the number of property cards found (for debugging)
    const containers = $('div[data-testid="sl.explore.card-container"]');
    console.log('Found card containers:', containers.length);

    // Loop through each property card and extract data
    containers.each((_, cardEl) => {
        // A) Gather images from inside the "PhotosContainer"
        const imageArray = [];
        $(cardEl)
            .find('div[data-testid="sl.explore.PhotosContainer"] img')
            .each((_, imgEl) => {
                const src = $(imgEl).attr('src')?.trim();
                if (src) {
                    imageArray.push(src);
                }
            });

        // B) main_image is the first image if available
        const main_image = imageArray.length > 0 ? imageArray[0] : '';

        // C) Get the property detail link from the covering link
        const linkHref =
            $(cardEl)
                .find('a[data-testid="sl.explore.coveringLink"]')
                .attr('href')?.trim() ?? '';
        const link = linkHref.startsWith('http')
            ? linkHref
            : `https://www.seloger.com${linkHref}`;

        // D) Get linkTitle attribute from the covering link
        const linkTitle =
            $(cardEl)
                .find('a[data-testid="sl.explore.coveringLink"]')
                .attr('title')?.trim() ?? '';

        // E) Get linkText from the title element
        const linkText = $(cardEl).find('div[data-test="sl.title"]').text().trim();

        // F) Get location from the address element
        const location = $(cardEl).find('div[data-test="sl.address"]').text().trim();

        // G) Get price from the price label element
        const price = $(cardEl).find('div[data-test="sl.price-label"]').text().trim();

        // H) Get description from the card description element
        const description = $(cardEl)
            .find('div[data-testid="sl.explore.card-description"]')
            .text()
            .trim();

        // I) Parse bed, bath, habitable, and land info from the tags line
        let info_beds = '';
        let info_bath = '';
        let info_habitable = '';
        let info_land = '';
        $(cardEl)
            .find('ul[data-test="sl.tagsLine"] li')
            .each((_, liEl) => {
                const txt = $(liEl).text().trim().toLowerCase();
                if (txt.includes('bedroom')) {
                    info_beds = txt.replace(/\D+/g, '');
                } else if (txt.includes('bath')) {
                    info_bath = txt.replace(/\D+/g, '');
                } else if (txt.includes('m²') && !txt.includes('land')) {
                    info_habitable = txt.replace(/\D+/g, '');
                } else if (txt.includes('land')) {
                    info_land = txt.replace(/\D+/g, '');
                }
            });

        // J) Some fields might not be available on SeLoger; set them to empty strings.
        const location_details = '';
        const ref = '';
        const location_map = '';

        // K) Build the final property object matching your standard structure
        properties.push({
            site: 'SeLoger.com',
            images: imageArray,
            main_image,
            linkText,
            linkHref,
            linkTitle,
            link,
            location_map,
            info_beds,
            info_bath,
            info_habitable,
            info_land,
            description,
            location_details,
            ref,
            location,
            price,
        });
    });

    console.log('Total properties scraped from SeLoger:', properties.length);
    return properties;
}

/******************************************************
 * scrapeLeboncoin()
 * ----------------------------------------------------
 * Example function using Axios + Cheerio.
 * (Left as-is from your code; no puppeteer needed.)
 ******************************************************/
async function scrapeLeboncoin() {
    
    const url = 'https://www.leboncoin.fr/c/ventes_immobilieres';
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Set a realistic User-Agent to mimic a real browser
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/112.0.5615.121 Safari/537.36'
    );

    // Navigate to the target URL and wait until network is idle
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const response = await axios.get(url);
    const html = response.data;
    const $ = load(html);

    const properties = [];
    $('.card-annonce-liste').each((_, el) => {
        const title = $(el).find('.annonce-title').text().trim();
        const price = $(el).find('.annonce-price').text().trim();
        const location = $(el).find('.annonce-geo').text().trim();
        const link = $(el).find('a').attr('href');

        properties.push({
            site: 'EntreParticuliers',
            title,
            location,
            price,
            link: link ? `https://www.entreparticuliers.com${link}` : '',
        });
    });

    return properties;
}

/******************************************************
 * scrapeKyero()
 * ----------------------------------------------------
 * Example function using Axios + Cheerio.
 ******************************************************/
async function scrapeKyero() {
    const url = 'https://www.kyero.com/fr/immobilier-a-vendre-en-france';
    // Some sites require a more legitimate user agent
    const headers = {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/112.0.5615.121 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    };

    const response = await axios.get(url, { headers });
    const html = response.data;
    const $ = load(html);

    const properties = [];
    $('article.property-card').each((_, el) => {
        // Example logic
        const main_image = $(el).find('.main_image').href?.trim() ?? '';
        const title = $(el).find('.title').text().trim();
        const location = $(el).find('.location_full').text().trim();
        const location_details = $(el).find('.location_details').text().trim();
        const price = $(el).find('.price').text().trim();
        // ...
        const link = $(el).find('a').attr('href');

        properties.push({
            site: 'Kyero',
            title,
            location,
            price,
            link: link ? `https://www.kyero.com${link}` : '',
        });
    });

    return properties;
}

/******************************************************
 * /api/scrape
 * ----------------------------------------------------
 * The unified Express endpoint that triggers all scraping
 ******************************************************/
app.get('/api/scrape', async (req, res) => {
    try {
        console.log('Scraping started...');
        const [frenchProps, seLogerProps, leboncoinProps] = await Promise.all([
            // Puppeteer is used only in scrapeSeLoger() above
            scrapeFrenchProperty(),
            scrapeSeLoger(),
            scrapeLeboncoin(),
            // scrapeKyero(),
        ]);
        console.log('Scraping success.');

        // Combine results
        const combined = [...frenchProps, ...seLogerProps, ...leboncoinProps];
        // Or add the others if you enable them
        // e.g. combined.push(...entrePartProps, ...kyeroProps);

        res.json(combined);
    } catch (error) {
        console.error('Error in /api/scrape:', error);
        res
            .status(500)
            .json([{ error: 'Error scraping data', details: error.message }]);
    }
});

/******************************************************
 * Start the server
 ******************************************************/
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
