// @ts-nocheck
// disable typescript checking for development


import { rejects } from 'assert';
import moment, { Moment } from 'moment'

// taken from https://github.com/jstnryan/helium-reward-log/blob/master/js/index.js

export type RewardEntry = {
    timestamp: string,
    minerHash: string,
    minerName: string,
    block: number,
    amount: number,
    id: number,
}


export type ServerDataResponse = {
    account: string,
    amount: number,
    block: number,
    gateway: string,
    hash: string,
    timestamp: string,
}

export type ServerResponse = {
    data: Array<ServerDataResponse>,
    cursor?: string
}

let openConnections = 0;
let errors:Array<any> = []
let retryCount = 3

let rewards:Array<Object> = [];
let gateways = {};
let prices = {};
let processed:Array<Array<string>> = [];
export let processedObjects:Array<RewardEntry> = [];

export function apiRequest(url:string, callback:(...params:any) => void) {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                --openConnections;
                callback(xhr.responseText, url);
            } else {
                openConnections = -1;
                if (errors.hasOwnProperty(url) && errors[url] >= retryCount) {
                    alert('There was a error while fetching reward info.');
                    // document.getElementById('button-download').disabled = true;
                    // document.getElementById('status-area').classList.add('u-hidden');
                    // document.getElementById('button-generate').disabled = false;
                } else {
                    if (errors.hasOwnProperty(url)) {
                        ++errors[url];
                    } else {
                        errors[url] = 1;
                    }
                    apiRequest(url, callback);
                }
            }
        }
    }
    ++openConnections;
    xhr.open("GET", url);
    xhr.send();
}

export function promiseApiRequest(url:string):Promise<ServerResponse> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText))
                } else {
                    reject('server rejected request')
                }
            }
        }
        xhr.open("GET", url);
        xhr.send();
    })
}

export function promiseIterableApiRequest(url:string, stackingData:Array<ServerDataResponse>):Promise<Array<ServerDataResponse>> {
    console.log('calling iterable request')
    return promiseApiRequest(url).then((response) => {
        const newData = stackingData;
        if(response.hasOwnProperty('data')){
            console.log('adding more entries', stackingData.length, response.data.length)
            newData.push(...response.data)
        }
        if (response.hasOwnProperty('cursor')) {
                const newUrl = url.slice(0, url.indexOf('&cursor=')) + '&cursor=' + response.cursor
                // loop over cursors
                return promiseIterableApiRequest(newUrl, newData)
            } else {
                // exit condition
                return newData
            }

        })
}

// iterable promises source: https://cmichel.io/dynamically-chaining-promises
export function promiseAllApiRequest(initialUrl:string):Promise<Array<ServerDataResponse>> {
    return new Promise((resolve, reject) => {
        promiseApiRequest(initialUrl).then((response) => {
            if (response.hasOwnProperty('cursor')) {
                const newUrl = initialUrl.slice(0, initialUrl.indexOf('&cursor=')) + '&cursor=' + response.cursor
                // loop over cursors
                resolve(promiseIterableApiRequest(newUrl, response.data))
            } else {
                // end conditionf
                resolve(response)
            }

        })
    })
}


export function getOwnerRewards(ownerAddress:string, startTime:Moment, endTime:Moment):Promise<Array<RewardEntry>> {
    // error within the api requiring a negative UTC offset
    const formatedStartTime = startTime.utcOffset(-60).format('YYYY-MM-DDTHH:mm:ssZ')
    const formatedEndTime = endTime.utcOffset(-60).format('YYYY-MM-DDTHH:mm:ssZ')
    // console.log("getting rewards for", ownerAddress, formatedStartTime, formatedEndTime)    

    let url = 'https://api.helium.io/v1/accounts/' + ownerAddress + '/rewards?max_time=' + formatedEndTime + '&min_time=' + formatedStartTime;

    return promiseAllApiRequest(url).then((data) => {
        return processDataAsync(data)
    })
}

export function getHotspotsRewards(hotspotAddress:string, startTime:Moment, endTime:Moment):Promise<Array<RewardEntry>> {
    // error within the api requiring a negative UTC offset
    const formatedStartTime = startTime.utcOffset(-60).format('YYYY-MM-DDTHH:mm:ssZ')
    const formatedEndTime = endTime.utcOffset(-60).format('YYYY-MM-DDTHH:mm:ssZ')
    // console.log("getting rewards for", hotspotAddress, formatedStartTime, formatedEndTime)    

    let url = 'https://api.helium.io/v1/hotspots/' + hotspotAddress + '/rewards?max_time=' + formatedEndTime + '&min_time=' + formatedStartTime;
    
    return promiseAllApiRequest(url).then((data) => {
        return processDataAsync(data)
    })
}

function setRewards(response, url) {
    response = JSON.parse(response);
    console.log(response)
    console.log("got response", response)
    if (response.hasOwnProperty('data')) {
        for (let d = 0; d < response.data.length; d++) {
            rewards.push(response.data[d]);
            if (!gateways.hasOwnProperty(response.data[d].gateway)) {
                gateways[response.data[d].gateway] = 'unknown';
                getGateway(response.data[d].gateway);
            }
        }
    }
    if (response.hasOwnProperty('cursor')) {
        apiRequest(
            url.slice(0, url.indexOf('&cursor=')) + '&cursor=' + response.cursor,
            setRewards
        );
    } else {
        processData();
    }
}

function getGateway(hash:string) {
    apiRequest('https://api.helium.io/v1/hotspots/' + hash, setGateway);
}

function setGateway(response:string) {
    response = JSON.parse(response);
    gateways[response.data.address] = response.data.name;
}


function processData() {
    if (openConnections > 0) {
        // wait for API calls to finish before processing data
        setTimeout(function() { processData(); }, 1000);
        return;
    } else if (openConnections < 0) {
        return;
    }
    console.log("processing data", JSON.stringify(gateways), rewards)

    for (let r = 0; r < rewards.length; r++) {
        let amount = rewards[r].amount / 100000000; // "bones" per HNT
 

        let rArr = [
            rewards[r].timestamp,                          // timestamp
            gateways[rewards[r].gateway],                  // device
            rewards[r].block,                              // block
            amount,                                        // reward
        ];
        processed.push(rArr);
        console.log(rArr)

        let rObj:RewardEntry = {
            timestamp: rewards[r].timestamp,
            minerHash: rewards[r].gateway,
            minerName: gateways[rewards[r].gateway],
            block: rewards[r].block,
            amount: amount,
            id: rewards[r].block,
        }
        processedObjects.push(rObj)
    }
    console.log(processed)
}

function processDataAsync(rawRewardArray:Array<ServerDataResponse>):Array<RewardEntry> {
    return rawRewardArray.map((item, index) => {
        let amount = item.amount / 100000000; // "bones" per HNT
        let rObj:RewardEntry = {
            timestamp: item.timestamp,
            minerHash: item.gateway,
            // minerName: gateways[item.gateway],
            minerName: "to be pulled",
            block: item.block,
            amount: amount,
            id: item.block,
        }
        return rObj
    })
}