import React from 'react';
import logo from './logo.svg';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { Button, TextField, ToggleButton, ToggleButtonGroup, Fab } from '@mui/material';
import DateAdapter from '@mui/lab/AdapterMoment';
import moment, { Moment } from 'moment'
import { LocalizationProvider } from '@mui/lab';
import { DateTimePicker } from '@mui/lab';
import './App.css';
import { getOwnerRewards, getHotspotsRewards } from './requestAPI';
import { DataGrid, GridRowsProp, GridColDef, GridToolbarExport, GridToolbarContainer } from '@mui/x-data-grid';
import { RewardEntry } from './requestAPI';

const columns: GridColDef[] = [
  { field: 'timestamp', headerName: 'Time stamp (UTC)', width: 150 },
  { field: 'minerHash', headerName: 'Miner Hash', width: 150 },
  { field: 'minerName', headerName: 'Miner Name', width: 150 },
  { field: 'block', headerName: 'Block Number', width: 150 },
  { field: 'amount', headerName: 'Amount', width: 150 },
];

const formats = {
  monthAndYear: "yyyy MM",
};

function App() {

  const [hotspotAddress, onChangeHotspotAddress] = React.useState<string>('');
  const [ownerAddress, onChangeOwnerAddress] = React.useState<string>('');
  const [startDate, onChangeStartDate] = React.useState<Moment | null>(null);
  const [endDate, onChangeEndDate] = React.useState<Moment | null>(null);
  const [pullingData, onChangePullingData] = React.useState<boolean>(false);
  const [rows, onChangeRows] = React.useState<Array<RewardEntry>>([])
  const [source, onChangeSource] = React.useState<string>('hotspot')


  function CustomToolbar() {
    return (
      <GridToolbarContainer style={{
        justifyContent: 'center',
        display: rows.length > 0  ? 'block' : 'none',
        }}>
        <GridToolbarExport
          csvOptions={{
            allColumns: true,
            fileName:
              startDate !== null && endDate !== null ? 'heliumExport_'+source+'_'+startDate.format("YYYYMMDD-HH mm")+'_'+endDate.format("YYYYMMDD-HHmm")+'.csv' :
              'heliumExport.csv',
          }}
          printOptions={{
            disableToolbarButton: true
          }}
        />
      </GridToolbarContainer>
    );
  }


  return (
    <div className="App">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
      />
      <Container sx={{height: "70vh", marginBottom: 50} }>
      <LocalizationProvider dateAdapter={DateAdapter} >
      <Box
        my={2}
      >
        <Box
          mb={1}
        >
          <ToggleButtonGroup
            value={source}
            exclusive
            color="primary"
            fullWidth={true}
            onChange={(event, newSource) => {
              if (newSource !== null) {
                onChangeSource(newSource)
              }
            }}
            aria-label="Choose between hotspot or owner as data source"
          >
            <ToggleButton value="hotspot" aria-label="hotspot">
              Hotspot
            </ToggleButton>
            <ToggleButton value="owner" aria-label="owner">
              Owner
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {
          source === "hotspot" ?
          <TextField 
          value={hotspotAddress}
          maxRows={1}
          style={{
            width: 500
          }}
          id="hotspot_address"
          label="Hotspot address"
          variant="outlined"
          onChange={(event) => {
            onChangeHotspotAddress(event.target.value)
          }}
          />
          :
        <TextField 
          value={ownerAddress}
          maxRows={1}
          style={{
            width: 500
          }}
          id="owner_address"
          label="Owner address"
          variant="outlined"
          onChange={(event) => {
            onChangeOwnerAddress(event.target.value)
          }}
          />}
      </Box>
      <Box my={2}>
        <DateTimePicker
          label="Start Date"
          value={startDate}
          // inputFormat={"YYYY/MM/DD hh:mm"}
          onChange={(newValue) => {
            if(newValue !== null) onChangeStartDate(newValue);
          }}
          renderInput={(params) => <TextField {...params} style={{width: 500}} />}
          />
      </Box>
      <Box my={2}>
        <DateTimePicker
          label="End Date"
          value={endDate}
          minDate={startDate}
          // inputFormat={"YYYY/MM/DD hh:mm"}
          clearable={true}
          onChange={(newValue) => {
            if(newValue !== null) onChangeEndDate(newValue);
          }}
          renderInput={(params) => <TextField {...params} style={{width: 500}}  />}
          />
      </Box>

      <Box
        mt={2}
        mb={4}
      >

      <Button
        variant="contained"
        size={'large'}
        onClick={(event) => {
          console.log("clicked button")
          if(startDate !== null && endDate !== null){
            if(source === "hotspot"){
              onChangePullingData(true)
              onChangeRows([])
              getHotspotsRewards(hotspotAddress, startDate, endDate).then((data) => {
                onChangeRows(data)
              }).finally(() => {
                onChangePullingData(false)
              })
            } else if(source === "owner"){
              onChangePullingData(true)
              onChangeRows([])
              getOwnerRewards(ownerAddress, startDate, endDate).then((data) => {
                onChangeRows(data)
              }).finally(() => {
                onChangePullingData(false)
              })
            }
          }
        }}
        disabled={startDate === null || endDate === null}
        >{pullingData ? 'Pulling data' :  "Fetch rewards"}</Button>
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        style={{maxHeight: "100vh", marginBottom: 16,}}
        components={{
          Toolbar: CustomToolbar,
        }}
      />

      {/* 
      // Additional download only available on the MUI pro (paid) license
      <Fab
        variant="extended"
        size={'large'}
        onClick={(event) => {}}
        sx={{marginBottom: 2}}
        disabled={rows.length === 0}
      >
        Download data
      </Fab> */}
      
      
      </LocalizationProvider>
    </Container>
    </div>
  );
}

export default App;
