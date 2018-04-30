/*
* @Author: RayLin
* @Date:   2017-10-17 14:25:02
* @Last Modified by:   RayLin
* @Last Modified time: 2018-04-30 14:00:00
*/

const readlineSync = require('readline-sync');
const request = require("request");
const signalR = require('signalr-client');
const chalk = require('chalk');
const LoadURLJson = require('./url.json');

const MeasureTime = 1600;
let pool = [];
let _timeout;
let _start;

function main(url) {
    return new Promise((resolve, reject) => {
        console.log('\n');
        console.log('Connection Start ::: ' + url);
        const client  = new signalR.client(
            url,
            ['ServiceHub'],
            15,
            true
        );

        client.handlers.servicehub = { // hub name must be all lower case.
            echoack: function(name, message) { // method name must be all lower case, function signature should match call from hub
                console.log("revc => ");
                console.log(name);

                client.end();

                console.log(chalk.red.bold('ConnectingSignalR Measure Execution Time >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>'));
                console.log('URL: ' + url);
                // console.timeEnd('ConnectingSignalR');
                const _end = new Date().getTime();
                const _measur = _end - _start;
                console.log(_measur + ' ms');
                console.log(chalk.red.bold('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>'));

                if (_measur > MeasureTime) {
                    pool.push({
                        URL: url,
                        FinishTime: _measur
                    });
                }
                resolve(name.Message);
                // console.log("revc => " + name + ": " + message);
            }
        };

        client.serviceHandlers = { //Yep, I even added the merge syntax here.
            bound: function() { console.log("Websocket bound"); },
            connectFailed: function(error) {
                console.log("Websocket connectFailed: ", error);
                reject(error);
            },
            connected: function(connection) {
                console.log("Websocket connected");
                // console.log(client);

                _timeout = setTimeout(() => {
                    // console.log(client);
                    // console.log(client.serviceHandlers);
                    console.log(chalk.red('Error: No transport could be initialized successfully'));
                    client.end();

                    pool.push({
                        URL: url,
                        FinishTime: -1,
                        Error: 'No transport could be initialized successfully'
                    });

                    reject('Error: No transport could be initialized successfully');
                }, 20000);

                client.invoke(
                    'ServiceHub', // Hub Name (case insensitive)
                    'Echo',	// Method Name (case insensitive)
                    ' >>> invoked from ANCHOR_BOT'
                );
            },
            disconnected: function() { console.log("Websocket disconnected"); },
            onerror: function (error) { console.log("Websocket onerror: ", error); reject(error); },
            messageReceived: function (message) {
                // console.log("Websocket messageReceived: ", message);
                return false;
            },
            bindingError: function (error) { console.log("Websocket bindingError: ", error); reject(error); },
            connectionLost: function (error) { console.log("Connection Lost: ", error); reject(error); },
            reconnecting: function (retry /* { inital: true/false, count: 0} */) {
                console.log("Websocket Retrying: ", retry);
                //return retry.count >= 3; /* cancel retry true */
                return true;
            }
        };

        client.start();
        // console.time('ConnectingSignalR');
        _start = new Date().getTime()
    });
}

function sendToSlack(text, area = 'none') {
    return new Promise((resolve) => {
        if (text) {
            // console.log('Send to slack');
            console.log(text);
            let _text = `Test location from >>> ${area.toUpperCase()} \n`;
            _text = _text + text;

            const options = {
                uri: 'https://hooks.slack.com/xxxxxxxxxxxx',
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
                    console.log(err)
                } else {
                    // console.log(body);
                }
                resolve(true);
            });
        } else {
            resolve(true);
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = async (target = 'prod', area = 'none', prompt = false) => {
    let lists;
    if (target === 'alpha') {
        lists = LoadURLJson.forSignalRAlpha;
    } else {
        lists = LoadURLJson.forSignalR;
    }

    for (let i = 0; i < lists.length; i++) {
        if (_timeout) {
            clearTimeout(_timeout);
        }

        try {
            await main(lists[i]);
            await sleep(3000);
        } catch(e) {
            console.log(e);
            await sleep(3000);
        }
    }

    if (_timeout) {
        clearTimeout(_timeout);
    }

    let slack = '';
    pool.forEach(function(ele) {
        if (ele.Error) {
            slack += `> SignalRURL : ${ele.URL}  FinishTime : ${ele.FinishTime} ms  Error : ${ele.Error} \n`;
        } else {
            slack += `> SignalRURL : ${ele.URL}  FinishTime : ${ele.FinishTime} ms \n`;
        }
    });

    await sendToSlack(slack, area);

    if (prompt) {
        const userName = readlineSync.question('ALL EVENT DONE! Type Enter to Say Goodbye!!!');
    }

    console.log(chalk.blue.bold('BYE!!!!!!!!!!!!!!!!!'));
};
