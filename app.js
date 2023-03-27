const Apify = require('apify');
const util = require('util');
// get the client
const mysql = require('mysql2/promise');
require('dotenv').config({path: __dirname + '/.env'})

function trim(s, mask) {
    while (~mask.indexOf(s[0])) {
        s = s.slice(1);
    }
    while (~mask.indexOf(s[s.length - 1])) {
        s = s.slice(0, -1);
    }

    return s;
}

async function saveData(data, articleId)
{
    data = data.replace(/,|€/g, '.');
    data = data.trim();
    data = trim(data, '.');
    data = data.trim();

     // console.log(data, articleId);
    var sql = 'insert into historic (article_id, date, price) values ?';
    var values = [
        [articleId, (new Date()).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " "), data]
    ];

    // create the connection
    const connection = await mysql.createConnection({
        host     : '127.0.0.1',
        user     : 'vincent',
        password : '123456',
        database : 'productcrawler'
    });

    // console.log(values);
    await connection.query(sql, [values], function (error, results, fields) {
        if (error) {
            console.error(error);
            throw error;
        }
    });

    await connection.end();
}

async function getProducts() {
    // create the connection
    const connection = await mysql.createConnection({
        host     : '127.0.0.1',
        user     : 'vincent',
        password : '123456',
        database : 'productcrawler'
    });
    // query database
    return [rows, fields] = await  connection.execute('SELECT a.id, a.uri, a.x_path_price, s.url from article a left join site s on a.site_id=s.id where a.actif=1');
}

async function crawl(results) {
        const sources = results.map(function(ligne) {
            return {
                url : ligne.url+ligne.uri,
                userData : {
                    'xpath' : ligne.x_path_price,
                    'id' : ligne.id
                }
            }
        });       
        const requestList = await Apify.openRequestList(null, sources);
        const crawler = new Apify.PuppeteerCrawler({
            requestList,
            handlePageFunction: async ({ request, page }) => {                
                await Apify.utils.puppeteer.injectJQuery(page);
                var request2 = request;
                const prix = await page.evaluate((request) => {
                    return $(request.userData.xpath).text();
                }, request);
                // console.log('Prix de la page '+request.userData.id+': '+prix);
                await saveData(prix, request.userData.id);
            },
            //Wait for the page to be fully loaded
            gotoFunction: ({request, page}) => {
                return page.goto(request.url, { waitUntil: 'networkidle2' })
            },
            launchPuppeteerOptions: {
                headless: true,
                useChrome: false
            },
        });
    
        await crawler.run();
};

getProducts().then(([rows, fields]) => {
    // console.log(rows);
    crawl(rows).then(() => {
        debugger
        return process.exit(0);
    });
});
