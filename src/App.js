import React, { useState, Component, useEffect } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import { tableCellClasses } from '@mui/material/TableCell';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Plotly from 'plotly.js-dist';
import Paper from '@mui/material/Paper';
import { TableContainer } from '@mui/material';
import { TablePagination } from '@mui/material';
import ReactLoading from "react-loading";
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import moment from 'moment';
import { bgcolor, padding } from '@mui/system';
import background from "./img/background.jpeg";
import bg from "./img/background.jpg";

function Dashboard() {
	const [loadData, setData] = useState(null);
	const [columns, setColumns] = useState([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const cols = ["Flow-Rate", "Volume"];
	const [maxFlow, setMaxFlow] = useState(-1e5);
	const [minFlow, setMinFlow] = useState(+1e5);
	const [totalVol, setTotalVol] = useState(0);
	const [avgFlow, setAvgFlow] = useState(0);

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(event.target.value, 10);
		setPage(0);
	};

	// Function toget all the fields from the channel
	const getColumns = (data) => {
		var tempColumns = []
		for (var key in data[0]) {
			tempColumns.push(key);
		}
		return tempColumns;
	};

	const changeKeyName = (data) => {
		for (var i = 0; i < data.length; i++) {
			for (var key in data[i]) {
				if (key == 'created_at') {
					data[i]['Timestamp'] = data[i][key];
					delete data[i][key];
				}
				else if (key == 'field1') {
					data[i]['Flow-Rate'] = data[i][key];
					delete data[i][key];
				}
				else if (key == 'field2') {
					data[i]['Volume'] = data[i][key];
					delete data[i][key];
				}
			}
		}
		return data;
	}

	const divideDate = (data) => {
		for (var i = 0; i < data.length; i++) {
			data[i]['Date'] = data[i]['created_at'].split('T')[0];
			data[i]['Time'] = data[i]['created_at'].split('T')[1].split('Z')[0];
		}
		return data;
	};

	const Input = styled('input')({
		display: 'none',
		margin: '20px auto',
		width: '100%',
		marginBottom: '1rem',
	});

	const StyledTableCell = styled(TableCell)(({ theme }) => ({
		[`&.${tableCellClasses.head}`]: {
			backgroundColor: theme.palette.common.black,
			color: theme.palette.common.white,
		},
		[`&.${tableCellClasses.body}`]: {
			fontSize: 14,
		},
	}));

	const StyledTableRow = styled(TableRow)(({ theme }) => ({
		'&:nth-of-type(odd)': {
			backgroundColor: theme.palette.action.hover,
		},
		// hide last border
		'&:last-child td, &:last-child th': {
			border: 0,
		},
	}));

	const Item = styled(Paper)(({ theme }) => ({
		...theme.typography.body2,
		padding: theme.spacing(1),
		color: theme.palette.text.secondary,
	}));

	const setAnalytics = (temp) => {
		var maxTemp = -1e5;
		var minTemp = 1e5;
		var sumRate = 0;
		var firstVol = -1;
		var lastVol = -1;
		for (var i = 0; i < temp.length; i++) {
			var currDate = temp[i]['Date'];
			console.log(temp)
			if (currDate == "2022-09-03") {
				var flowRate = temp[i]['Flow-Rate'];
				var volume = temp[i]['Volume'];
				if (firstVol == -1) {
					firstVol = volume;
				}
				if (volume != 0)
					lastVol = volume;
				flowRate = parseFloat(flowRate);
				sumRate += flowRate;
				if (flowRate > maxTemp) {
					maxTemp = flowRate;
				}
				if (flowRate < minTemp) {
					minTemp = flowRate;
				}
			}
		}
		sumRate = sumRate / temp.length;
		setMaxFlow(maxTemp);
		setMinFlow(minTemp);
		setAvgFlow(sumRate);
		setTotalVol(lastVol - firstVol);
	};

	const query = "https://api.thingspeak.com/channels/1837528/feeds.json?results=200"
	// Function to extract data from thingspeak
	const handleAPIcall = (e) => {
		e.preventDefault();
		setData(null);
		axios.get(query)
			.then(res => {
				res = res.data.feeds;
				console.log(res);
				var temp = changeKeyName(divideDate(res));
				setData(temp);
				setColumns(getColumns(res));
				setAnalytics(temp);
			})
			.catch(err => {
				console.log(err);
			});
	};

	useEffect(() => {
		axios.get(query)
			.then(res => {
				res = res.data.feeds;
				var temp = changeKeyName(divideDate(res));
				setData(temp);
				setColumns(getColumns(res));
				setAnalytics(temp);
			})
			.catch(err => {
				console.log(err);
			});
	}, [])

	useEffect(() => {
		if (loadData) {
			for (var col in cols) {
				var xdata = [];
				var ydata = [];

				loadData.forEach((row) => (
					xdata.push(row.Timestamp),
					ydata.push(row[cols[col]])
				));
				var template = {
					x: xdata,
					y: ydata,
					type: 'scatter',
					mode: 'lines'
				};

				var titleString = cols[col] + " Graph"
				var xString = "Date-Time";
				var yString = "";
				if (cols[col] == "Flow-Rate")
					yString = "Flow-Rate (L/min)"
				else if (cols[col] == "Volume")
					yString = "Volume (L)"

				var layout = {
					xaxis: { title: xString },
					yaxis: { title: yString },
					title: { text: titleString},
					plot_bgcolor:"#adcef0",
					paper_bgcolor:"#cfd0d1"
				}
				Plotly.newPlot(cols[col], [template], layout);
			}
		}
	}, [loadData])

	const maxFlowCard = (
		<React.Fragment>
			<CardContent>
				<Typography sx={{ fontSize: 18, textAlign: "center" }} color="text.primary" gutterBottom>
					Max Flow Rate (L/min)
				</Typography>
				<Typography sx={{ fontSize: 18, textAlign: "center" }} color="black">
					{maxFlow.toFixed(2)}
				</Typography>
			</CardContent>
		</React.Fragment>
	);

	const minFlowCard = (
		<React.Fragment>
			<CardContent>
				<Typography sx={{ fontSize: 18, textAlign: "center" }} color="text.primary" gutterBottom>
					Min Flow Rate (L/min)
				</Typography>
				<Typography sx={{ fontSize: 18, textAlign: "center" }} color="black">
					{minFlow.toFixed(2)}
				</Typography>
			</CardContent>
		</React.Fragment>
	);

	const dailyAverageCard = (
		<React.Fragment>
			<CardContent>
				<Typography sx={{ fontSize: 18, textAlign: "center" }} color="text.primary" gutterBottom>
					Average Flow Rate (L/min)
				</Typography>
				<Typography sx={{ fontSize: 18, textAlign: "center" }} color="black">
					{avgFlow.toFixed(2)}
				</Typography>
			</CardContent>
		</React.Fragment>
	);

	const dailyTotalVolumeCard = (
		<React.Fragment>
			<CardContent>
				<Typography sx={{ fontSize: 18, textAlign: "center" }} color="text.primary" gutterBottom>
					Daily Consumption (L)
				</Typography>
				<Typography sx={{ fontSize: 18, textAlign: "center" }} color="black">
					{totalVol.toFixed(2)}
				</Typography>

			</CardContent>
		</React.Fragment>
	);

	const analyStyle = { backgroundColor: "#90CAF9", borderRadius: "40px" };

	const analytics = () => {
		return (
			<Grid container spacing={3} padding={3}>
				<Grid item xs={3}>
					<Card style={analyStyle} variant="outlined">{maxFlowCard}</Card>
				</Grid>
				<Grid item xs={3}>
					<Card style={analyStyle} variant="outlined">{minFlowCard}</Card>
				</Grid>
				<Grid item xs={3}>
					<Card style={analyStyle} variant="outlined">{dailyAverageCard}</Card>
				</Grid>
				<Grid item xs={3}>
					<Card style={analyStyle} variant="outlined">{dailyTotalVolumeCard}</Card>
				</Grid>
			</Grid>
		);
	};

	const loadingScreen = () => {
		return (

			<ReactLoading
				type={"bars"}
				color={"#03fc4e"}
				height={100}
				width={100}
			/>);
	};

	// Function to show data in table
	const renderTable = () => {
		return (
			<Item>
				<TableContainer component={Paper}>
					<Table sx={{ minWidth: 700 }} aria-label="customized table">
						<TableHead>
							<TableRow>
								{
									columns.map((row, index) => (
										<StyledTableCell align="center" key={index}>{row}</StyledTableCell>
									))
								}
							</TableRow>
						</TableHead>
						<TableBody>
							{
								loadData
									.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
									.map((row, index) => (
										<StyledTableRow key={index}>
											{
												columns.map((r, ind) => (
													<StyledTableCell align="center" key={ind}>{row[r]}</StyledTableCell>
												))
											}
										</StyledTableRow>
									))
							}
						</TableBody>
					</Table>
					<TablePagination
						rowsPerPageOptions={[5, 10, 25]}
						component="div"
						count={loadData.length}
						rowsPerPage={rowsPerPage}
						page={page}
						onPageChange={handleChangePage}
						onRowsPerPageChange={handleChangeRowsPerPage}
					/>
				</TableContainer>
			</Item>
		);
	};

	const backStyle = { backgroundImage: `url(${background})`, backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', padding: "50px" };
	const backStyle2 = { backgroundImage: `url(${bg})`, backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', padding: "20px" };

	return (
		// <div style={{backgroundColor: "#b3d6e8", padding:"50px"}}>
		<div style={backStyle2}>
			{/* <div style = {{backgroundColor:"#77c6ed", padding:"20px", boxShadow: "3px"}}> */}
			<div style={backStyle}>
				<Grid container spacing={5}>
					{/* <Grid item xs={12}>
					</Grid> */}
					{/* <Grid item xs={12} align="center">
						<Button
							style={{
								borderRadius: 35,
								backgroundColor: "#21b6ae",
								padding: "18px 36px",
								fontSize: "18px"
							}}
							variant="contained"
							onClick={handleAPIcall}>Reload data</Button>
					</Grid> */}
					<Grid item xs={12}>
						{loadData ? (analytics()) : (loadingScreen())}
					</Grid>
					{cols.map((col, idx) => (
						<Grid item xs={6} key={idx}>
							{loadData ? (<div id={col} align="center"></div>) : (loadingScreen())}
						</Grid>
					))}
					<Grid item xs={12}>
						{loadData ? (renderTable()) : (loadingScreen())}
					</Grid>
				</Grid>
			</div>
		</div>
	);

}


export default Dashboard;