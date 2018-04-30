/*
* @Author: RayLin
* @Date:   2017-10-17 14:25:02
* @Last Modified by:   RayLin
* @Last Modified time: 2018-04-30 14:00:00
*/

const request = require("request");
const chalk = require('chalk');
const readlineSync = require('readline-sync');
const log = console.log;
const pat = /^(https?:\/\/)?(?:www\.)?([^\/]+)/;
const LoadURLJson = require('./url.json');
const URL = LoadURLJson.forRequest;

let Slack = '';

function requestURL(url) {
    return new Promise((resolve, reject) => {
        log(chalk.bgBlue(url));
        request.get({
            url : url,
            time : true,
            timeout: 20000
        },function(error, response){
            if (error) {
                log(error.code);
                reject(error);
            } else {
                log(response.statusCode);
                resolve(response);
                // log('Request time in ms', response.elapsedTime);
            }
        });
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const _arr = [];
    for (let i = 0; i < URL.length; i++) {
        try {
            const _rep = await requestURL(URL[i]);
            _arr.push({
                URL: URL[i],
                ResponseTime: _rep.elapsedTime
            });
            log(chalk.bgBlue('Request time in ms ::: ', _rep.elapsedTime + '\n'));
        } catch(e) {
            _arr.push({
                URL: URL[i],
                ResponseTime: -1,
                Error: e.code
            });
        }
    }

    const result = _arr.filter((d) => {
        return d.ResponseTime > 1500 || d.ResponseTime === -1;
    });

    log('\n');
    log(chalk.bold.bgRed('Slower Connection ::: \n'));
    if (result.length > 0) {
        result.forEach(function(ele) {
            const _u = ele.URL.match(pat);

            log(chalk.bgRed('URL : ' + (_u[2] || _u[0])));
            log(chalk.bgRed('ResponseTime : ' + ele.ResponseTime));

            if (ele.Error) {
                log(chalk.bgRed('Error : ' + ele.Error));
                Slack += `> URL : ${_u[2]}  ResponseTime : ${ele.ResponseTime} ms  Error : ${ele.Error} \n`;
            } else {
                Slack += `> URL : ${_u[2]}  ResponseTime : ${ele.ResponseTime} ms \n`;
            }

            log('\n');
        });
    }

    await sleep(1000);
    log('DONE');
}

function sendToSlack(text, area = 'none') {
    return new Promise((resolve) => {
        if (text) {
            let _text = `Test location from >>> ${area.toUpperCase()} \n`;
            _text = _text + text;

            // Send To Slack
            const options = {
                uri: 'https://hooks.slack.com/xxxxxxxxxxxxx',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                json: {
                    text: _text
                }
            };

            request.post(options, function (err, response, body) {
                if (err) {
                    log(err)
                } else {
                    // log(body);
                }
                resolve(true);
            });
        } else {
            resolve(true);
        }
    });
}

module.exports = async (area = 'none', prompt = false) => {
    for (let i = 0; i < 2; i++) {
        const _count = i + 1;
        log(chalk.blue('RUN TASK :::::::::::::::::: ' + _count + '\n'));
        await main();
        log(chalk.blue('END TASK :::::::::::::::::: ' + _count + '\n'));

        await sleep(3000);
    }

    await sendToSlack(Slack, area);

    if (prompt) {
        const userName = readlineSync.question('ALL EVENT DONE! Type Enter to Say Goodbye!!!');
    }

    log(chalk.blue.bold('BYE!!!!!!!!!!!!!!!!!'));
};
