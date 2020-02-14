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
        password : '201185',
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
        password : '201185',
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
            headless: true
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


/*
// node native promisify
const query = util.promisify(connection.query).bind(connection);

(async () => {
    try {
      const rows = await query('SELECT a.id, a.uri, a.x_path_price, s.url from article a left join site s on a.site_id=s.id where a.actif=1');
      console.log(rows);
    } finally {
      conn.end();
    }
  })()



console.log((new Date()).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " "));
callUrl();

setTimeout((function() {
    return process.exit(0);
}), 10000);



function callUrl(){
    connection.connect((err) => {
        if (err) throw err;
        console.log('Connected!');
    });

    results = connection.query('SELECT a.id, a.uri, a.x_path_price, s.url from article a left join site s on a.site_id=s.id where a.actif=1');
    console.log(results);
        if (error) throw error;
        
    
       /*     
        console.log(results);
        
        //Apify.main(async (results) => {
            
            console.log('Results : '+results);


            
            const sources = results.map(function(ligne) {
                return {
                    url : ligne.url,
                    userData : {'xpath' : ligne.x_path_price}
                }
            });

            /*
            const requestList = new Apify.RequestList({
                sources: sources
            });
            

            const requestList = await Apify.openRequestList('categories', sources);
        
            const crawler = new Apify.PuppeteerCrawler({
                requestList,
                // puppeteerPoolOptions: {
                //     useLiveView: false,
                // },
                handlePageFunction: async ({ page, request }) => {
                    // This function is called to extract data from a single web page
                    // 'page' is an instance of Puppeteer.Page with page.goto(request.url) already called
                    // 'request' is an instance of Request class with information about the page to load
                    // await Apify.pushData({
                    //     title: await page.title(),
                    //     url: request.url,
                    //     succeeded: true,
                    // });
        
                    await Apify.utils.puppeteer.injectJQuery(page);
                    const price = await page.evaluate(() => {
                        return $(request.xpath).text();
                    });
                    console.log('Prix : ' + price);
                    
                        
                },
            });
        
            await crawler.run();
        });
        
    //});
}

function trim(s, mask) {
    while (~mask.indexOf(s[0])) {
        s = s.slice(1);
    }
    while (~mask.indexOf(s[s.length - 1])) {
        s = s.slice(0, -1);
    }

    return s;
}

(function(){
    console.log((new Date()).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " "));
    callUrl();

    setTimeout((function() {
        return process.exit(0);
    }), 10000);
})();



Apify.main(async () => {
    const sources = [
        'https://apify.com/store?category=TRAVEL'
    ];

    const requestList = await Apify.openRequestList('categories', sources);

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        // puppeteerPoolOptions: {
        //     useLiveView: false,
        // },
        handlePageFunction: async ({ page, request }) => {
            // This function is called to extract data from a single web page
            // 'page' is an instance of Puppeteer.Page with page.goto(request.url) already called
            // 'request' is an instance of Request class with information about the page to load
            // await Apify.pushData({
            //     title: await page.title(),
            //     url: request.url,
            //     succeeded: true,
            // });

            await Apify.utils.puppeteer.injectJQuery(page);
            const h1 = await page.evaluate(() => {
                return $('h1').text();
            });
            console.log('Titre de la page : ' + await page.title());
            console.log('H1 de la page : ' + h1);
            
                
        },
    });

    await crawler.run();
});





/*

const phantom = require('phantom');
const $       = require('cheerio');
const connection      = require('mysql').createConnection({
    host     : '127.0.0.1',
    user     : 'vincent',
    password : '201185',
    database : 'productcrawler'
});

function callUrl(){
    connection.connect((err) => {
        if (err) throw err;
        console.log('Connected!');
    });

    connection.query('SELECT a.id, a.uri, a.x_path_price, s.url from article a left join site s on a.site_id=s.id where a.actif=1', function (error, results, fields) {
        if (error) throw error;
        results.forEach( (row) => {
            // console.log(row);
            crawler(row.url+row.uri, row.x_path_price, row.id);
        });
    });
}

function saveData(data, articleId)
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
    // console.log(values);
    connection.query(sql, [values], function (error, results, fields) {
        if (error) {
            console.error(error);
            throw error;
        }
    });
}

function trim(s, mask) {
    while (~mask.indexOf(s[0])) {
        s = s.slice(1);
    }
    while (~mask.indexOf(s[s.length - 1])) {
        s = s.slice(0, -1);
    }

    return s;
}

async function crawler(site, find, articleId) {
    console.log(site);
    const instance = await phantom.create();
    const page = await instance.createPage();
    // page.settings.resourceTimeout = 5000; //5 seconds

    const status = await page.open(site);

    do { page.sendEvent('mousemove'); } while (page.loading);

    const content = await page.property('content');
    await instance.exit();

    await $(find, content).each(function () {
        console.log($(this).text());
        saveData($(this).text(), articleId);
    });
};

(function(){
    console.log((new Date()).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " "));
    callUrl();

    setTimeout((function() {
        return process.exit(0);
    }), 10000);
})();

*/



