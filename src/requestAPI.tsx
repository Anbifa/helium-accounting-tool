// @ts-nocheck
// disable typescript checking for development

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

export type ServerRewardResponse = {
    account: string,
    amount: number,
    block: number,
    gateway: string,
    hash: string,
    timestamp: string,
}

export type ServerMinerResponse = {
    address: string,
    name: string,
    block: number,
    block_added: number,
    elevation: number,
    gain: number,
    geocode: {
        city_id: string
        long_city: string
        long_country: string,
        long_state: string,
        long_street: string,
        short_city: string
        short_country: string,
        short_state: string,
        short_street: string,
    }
    last_change_block: number,
    last_poc_challenge: number,
    lat: number,
    lng: number,
    location: string,
    location_hex: string,
    mode: string,
    nonce: number,
    owner: string,
    payer: string,
    reward_scale: number,
    speculative_nonce: number,
    status: {
        timestamp: string,
        online: string,
        listen_addrs: Array<string>,
        height: number
    }
    timestamp_added: string
}

export type ServerResponse = {
    data: Array<ServerRewardResponse>,
    // data: Array<ServerRewardResponse> | Array<ServerMinerResponse>,
    cursor?: string
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

export function iterableApiRequest(url:string, stackingData:Array<ServerRewardResponse>):Promise<Array<ServerRewardResponse>> {
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
                return iterableApiRequest(newUrl, newData)
            } else {
                // exit condition
                return newData
            }

        })
}

// iterable promises source: https://cmichel.io/dynamically-chaining-promises
export function initialApiRequest(initialUrl:string):Promise<Array<ServerRewardResponse>> {
    return new Promise((resolve, reject) => {
        promiseApiRequest(initialUrl).then((response) => {
            if (response.hasOwnProperty('cursor')) {
                const newUrl = initialUrl.slice(0, initialUrl.indexOf('&cursor=')) + '&cursor=' + response.cursor
                // loop over cursors
                resolve(iterableApiRequest(newUrl, response.data))
            } else {
                // end condition
                resolve(response.data)
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

    return initialApiRequest(url).then((data) => {
        return processDataAsync(data).then((d) => {
            return d
        })
    })
}

export function getHotspotsRewards(hotspotAddress:string, startTime:Moment, endTime:Moment):Promise<Array<RewardEntry>> {
    // error within the api requiring a negative UTC offset
    const formatedStartTime = startTime.utcOffset(-60).format('YYYY-MM-DDTHH:mm:ssZ')
    const formatedEndTime = endTime.utcOffset(-60).format('YYYY-MM-DDTHH:mm:ssZ')
    // console.log("getting rewards for", hotspotAddress, formatedStartTime, formatedEndTime)    

    let url = 'https://api.helium.io/v1/hotspots/' + hotspotAddress + '/rewards?max_time=' + formatedEndTime + '&min_time=' + formatedStartTime;
    
    return initialApiRequest(url).then((data) => {
        return processDataAsync(data).then((d) => {
            return d
        })
    })
}

function  getGateways(uniqueGatewayHashes:Array<string>):Promise<Map<string, string>> {
    let returnValue:Map<string, string> = new Map()
    return Promise.all(
            // request all hotspot names
            uniqueGatewayHashes.map((v, i, a) => {
                return initialApiRequest('https://api.helium.io/v1/hotspots/' + v)
            })
        ).then((values) => {
            console.log(values)
            // create map of hotspot hash & name
            values.forEach((v, i, a) => {
                returnValue.set(v.address, v.name.replace(/-/g, ' '))
            })
        }).then(() => {
            return returnValue
        })
}

function processDataAsync(rawRewardArray:Array<ServerRewardResponse>):Promise<Array<RewardEntry>> {
    const uniqueGatewayHashes:Array<string> = [...rawRewardArray.reduce((a,c)=>{
        a.set(c.gateway, c.gateway);
        return a;
    }, new Map()).values()]
    return getGateways(uniqueGatewayHashes).then((gatewayLookup) => {
        return rawRewardArray.map((item, index) => {
            let amount = item.amount / 100000000; // "bones" per HNT
            let rObj:RewardEntry = {
                timestamp: item.timestamp,
                minerHash: item.gateway,
                minerName: gatewayLookup.get(item.gateway),
                block: item.block,
                amount: amount,
                id: item.block,
            }
            return rObj
        })
    })
}