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

    connection.query('SELECT a.id, a.uri, a.x_path_price, s.url from article a left join site s on a.site_id=s.id', function (error, results, fields) {
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
    data = trim(data, '.');
    data = data.trim();
    // console.log(data, articleId);
    var sql = 'insert into historic (article_id, date, price) values ?';
    var values = [
        [articleId, (new Date()).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " "), data]
    ]
    connection.query(sql, [values], function (error, results, fields) {
        if (error) {
            console.error(error)
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
    const instance = await phantom.create();
    const page = await instance.createPage();
    // page.settings.resourceTimeout = 5000; //5 seconds

    const status = await page.open(site);
    const content = await page.property('content');
    await instance.exit();

    await $(find, content).each(function () {
        saveData($(this).text(), articleId);
    });
};

(function(){
    callUrl();

    setTimeout((function() {
        return process.exit(22);
    }), 5000);
})();