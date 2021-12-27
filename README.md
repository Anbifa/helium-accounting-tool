# Helium Accounting Tool
This tool enables you to pull data of past rewards of the [helium cryptocurrency](https://helium.com) either per gateway or per owner address over a specified time frame.

## How to use it
You can either use the code hosted on github pages or pull project and run it yourself.

1. Select whether you want to fetch owner rewards or hotspot rewards
2. Enter the respective owner or hotspot address. You can find them by using the [helium explorer](https://explorer.helium.com/) and click the *copy to clipboard* icon next to a (shortened) hotspot or owner address.
3. Select the period you are interested in with the start time and end time. *Note:* The the API response is *inclusive* for the start time and *exclusive* for the end time. 
4. Press the Fetch Data button to pull the data

### Advanced useage
The parameters can also be embedded into a sharable link by the use of search query parameters. Consult the following table to generate such link. Not embedded parameters are left unset.

| Search query parameter | Format | Description |
| --- | --- | --- |
| `start` | `YYYYMMDDT:HH:mm:ss` | Start time of the period (UTC) |
| `end` | `YYYYMMDDT:HH:mm:ss` | End time of the period (UTC) |
| `hs` | | hotspt address |
| `ow` | | owner address |

It will switch between owner and hotspot mode dependent on which of the two is present. In case both are present, it will load in hotspot mode.


Example link for hotspot rewards: ```public.url/?start=20211201:23:00:00&end=2021-12-01:24:00:00&hs=112a8QwhBD6KVijygGUW2Wbot88EcGzNqaVH1ffubhZJgVEqyc1z```

Example link for owner rewards: ```public.url/?start=20211201:23:00:00&end=2021-12-01:24:00:00&ow=14YyE4Nr5piJr1iwTFZRAzgJWfc6FafDoR7TQB8Jypkg439iqhM```

## Use cases of this tool
- My motivation for developing this was to bring more **transparency** into the accounting of shared hotspots. This tool allows you to send a link with all relevant values to all involved parties allowing them to request the same data from the blockchain to verify their shares. 
- Next to that, as soon as the fiat conversion is built in, this tool can also be used for **taxation** purposes. The idea is that taxable income from mining is the minted amount valued at the conversion rate at the minting point in time. This should suffice for taxing purposes (*Disclaimer:* No tax advice! Consult with a professional in your jurisdiction!)
Up until this feature is implemented, I recommend using [Helium-reward-log](https://github.com/jstnryan/helium-reward-log) for such purposes.

## What is Helium?
A three sentence elevator pitch:

Helium is a company building up a crowd-sourced communication network based on LoRaWan technology. LoRaWan is a wide-area network technology enabling IoT devices to communicate in a very energy efficient manner, allowing for potentially longer battery life in comparison to other communication standards. Helium miners are LoRaWan gateways, which earn the HNT crypto token in return for being supplied with power and internet access.

For more information, check out the official website at [helium.com](https://helium.com)

## Development

### Prerequisites

As this project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app), it is required to be installad on the development machine. Please refer to the [CRA documentation](https://create-react-app.dev/docs/getting-started#quick-start) for more information on it

### Getting started

Clone this project, navigate into the project folder and run `yarn install` to install all its dependencies. 

### Available Scripts

In the project directory, you can run:

#### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

#### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).


## Future feature idea list
- Add an aggregated data table (especially sum)
- Advanced features
    - Split into shares
    - Add conversion to fiat money
- Analytics of the earnings
    - Graph view over time
    - Split over different hotspots
    - Split over different types of earnings

If you got any more feature ideas, feel free to reach out on github or post an issue.

## Related work
- [Helium-reward-log](https://github.com/jstnryan/helium-reward-log) is a great project with a similar goal built in plain HTML, CSS and JS. This makes it very lean and quick to setup yourself, but comes at the cost of useability and advanced features
- [helium-taxable-mining-earnings](https://github.com/evandiewald/helium-tax-tool-webpage) was made with a similar idea on a python backend. But it seems to fetch the full year of 2020 with hardcoded fiat conversion rates table.
- [Helium Analysis Tools](https://github.com/Carniverous19/helium_analysis_tools) provides tooling for indepth analysis of hotspots. It is more focused on the technical side of the (beacons & witnesses) and is not very focused on their rewards

## License
This project is licensed as open source software under a [MIT license](./LICENSE).