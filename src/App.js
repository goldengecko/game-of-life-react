import React, { Component } from 'react';
import logo from './genetics.jpg';
import { Container, Row, Col, Card, CardImg, CardTitle, CardBlock, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import InputRange from 'react-input-range';
import 'react-input-range/lib/css/index.css';

import LifeBoard from './LifeBoard';

// The size of history to keep when checking for oscillating loops
const HISTORY_CHECK_LENGTH = 5;

class App extends Component {
	
	constructor(props) {
		super(props);
		this.state = {
			rows: 25,
			columns:25,
			
			birth1:false,
			birth2:false,
			birth3:true,
			birth4:false,
			birth5:false,
			birth6:false,
			birth7:false,
			birth8:false,

			survival1:false,
			survival2:true,
			survival3:true,
			survival4:false,
			survival5:false,
			survival6:false,
			survival7:false,
			survival8:false,
			
			running:false,
			selection: {},
			fps: 10,
			currentGeneration: 0,
			exitReason: ''
		};

		this.handleChecked = this.handleChecked.bind(this);
		this.handleRun = this.handleRun.bind(this);
		this.randomize = this.randomize.bind(this);
		this.clearBoard = this.clearBoard.bind(this);
		this.handleCellClicked = this.handleCellClicked.bind(this);
		this.nextFrame = this.nextFrame.bind(this);
		this.countAdjacentCells = this.countAdjacentCells.bind(this);
	}
	
	/**
	 * Initial setup of the board happens after the component is mounted.
	 */
	componentDidMount() {
		this.randomize();
	}
	
	/**
	 * Initialize the board with randomly selected cells
	 */
    randomize(event) {
		let state = {};
		for (let row = 0 ; row < this.state.rows ; row ++ ) {
			for (let col = 0 ; col < this.state.columns; col ++ ) {
				state[[row,col]] = Math.round(Math.random());
			}
		};

		this.setState({
			selection:state,
			exitReason: '',
			currentGeneration: 0
		});
		
		if (event) {
			event.target.blur();
		}
    }
	
	/**
	 * Empty all the cells
	 */
	clearBoard(event) {
		let state = {};
		for (let row = 0 ; row < this.state.rows ; row ++ ) {
			for (let col = 0 ; col < this.state.columns; col ++ ) {
				state[[row,col]] = 0;
			}
		};

		this.setState({
			selection:state,
			exitReason: '',
			currentGeneration: 0
		});
	}
	
	/**
	 * Update the state to reflect changes to the birth and survival checkboxes.
	 * The data-rule attribute is used to pass in the birth or survival identifier.
	 */
	handleChecked(event) {
		var newState = {};
		newState[event.target.getAttribute('data-rule')] = event.target.checked;
		this.setState(newState);
	}
	
	/**
	 * Either start or stop the running of the simulation.
	 */
	handleRun(event) {
		const shouldRun = !this.state.running;
		this.setState({running: shouldRun});
		
		// Note that we use shouldRun here rather than reading from the state since state writing can be asynchronous
		if (shouldRun) {
			this.stateHistory = [];
			this.stateHistory.push(JSON.stringify(this.state.selection));
			this.setState({
				currentGeneration: this.state.currentGeneration+1,
				exitReason: ''
			});
			
	        this.animationFrame = requestAnimationFrame(this.nextFrame);
		} else {
			cancelAnimationFrame(this.animationFrame);
		}
	}
	
	/**
	 * Go to the next frame in the animation by sorting out which cells should be born and which should die.
	 */
	nextFrame() {
		let selection = Object.assign({}, this.state.selection);
		
		let stateChanged = false;
		
		for (let row = 0 ; row < this.state.rows ; row ++ ) {
			for (let col = 0 ; col < this.state.columns; col ++ ) {
				let count = this.countAdjacentCells(row, col);
				
				// console.log(count + " cells adjacent to " + row + ", " + col + " (currently " + this.state.selection[[row,col]] + ")");
				
				// Now see if we want to change the state.
				if (this.state.selection[[row,col]]) {
					// It is currently turned on - see whether it has the right number of lives to survive
					if (!this.state['survival' + count]) {
						selection[[row,col]] = 0;
						stateChanged = true;
						// console.log("Cell died at " + row + ", " + col);
					} 
				} else {
					// Currently not on - see if one should be born here
					if (this.state['birth' + count]) {
						selection[[row,col]] = 1;
						stateChanged = true;
						// console.log("Cell born at " + row + ", " + col);
					} 
				}
			}
		};
		
		if (stateChanged) {
			this.setState({selection: selection});
			
			// Now check whether we are just oscillating in a repeated loop. 
			// To do this, we will go back a defined number of generations and see if any of them match our current generation
			const newState = JSON.stringify(selection);
			
			const oldStates = this.stateHistory.slice(-HISTORY_CHECK_LENGTH);
			
			for (let thisState of oldStates) {
				if (newState === thisState) {
					this.setState({
						running: false,
						exitReason: 'Exited because of a loop after ' + this.state.currentGeneration + ' generations.'
					});
					return;
				}
			}

			// No need to keep endless state history around
			this.stateHistory = oldStates;
			this.stateHistory.push(newState);
			
			this.setState({currentGeneration: this.state.currentGeneration+1});
			
			let speed = 1000 / this.state.fps;
			setTimeout(() => {
				if (this.state.running) {
					this.animationFrame = requestAnimationFrame(this.nextFrame);
				}
			}, speed);
		} else {
			this.setState({
				running: false,
				exitReason: 'Exited in stable state after ' + this.state.currentGeneration + ' generations.'
			});
		}
	}
	
	/**
	 * Called when the user clicks on a cell on the board to toggle it.
	 */
	handleCellClicked(row, column) {	  	  
		let selection = Object.assign({}, this.state.selection);

		selection[[row,column]] = selection[[row,column]] ? 0: 1;
		this.setState({
			selection,
			exitReason: '',
			currentGeneration: 0
		});
	}
	
	/**
	 * Count the number of cells adjacent to the given location which are on. This checks up to 8 cells
	 * but needs to respect edges too.
	 */
    countAdjacentCells(row, col) {
		if (row < 0 || row > this.state.rows-1 || col < 0 || col > this.state.columns-1) {
			// TODO: Handle error nicely
			return 0;
		}
		let count = 0;
		// Previous row
		if (row - 1 >= 0) {
			count += (col - 1 < 0) ? 0 : this.state.selection[[row-1,col-1]];
			count += this.state.selection[[row-1,col]];
			count += (col + 1 >= this.state.columns) ? 0 : this.state.selection[[row-1,col+1]];
		}
		// Current row
		count += (col - 1 < 0) ? 0 : this.state.selection[[row,col-1]];
		count += (col + 1 >= this.state.columns) ? 0 : this.state.selection[[row,col+1]];
		// Next row
		if (row + 1 < this.state.rows) {
			count += (col - 1 < 0) ? 0 : this.state.selection[[row+1,col-1]];
			count += this.state.selection[[row+1,col]];
			count += (col + 1 >= this.state.columns) ? 0 : this.state.selection[[row+1,col+1]];
		}
		return count;
    };
	
	render() {
		return (
			<Container fluid>
				<Row>
					{
						// The first column is the setup and instructions
					}
					<Col md="4" sm="12" className="spaced">
						<Card>
							<CardImg src={logo} top  className="img-fluid" />
							<CardBlock>
								<CardTitle>Game of Life</CardTitle>
								<h3>Instructions</h3>
								<ul>
									<li>Clicking on the individual cells toggles them on and off.</li>
									<li>Click start/stop button to start/stop the simulation.</li>
									<li>Change the number of rows and columns using provided sliders.</li>
									<li>Change the birth and survival rules using the provided checkboxes.</li>
									<li>The number next to the birth/survival checkboxes indicate the number of neighbours required for birth of a new cell or survival of an existing cell.</li>
								</ul>
							</CardBlock>
							<CardBlock>
								<h3>Settings</h3>
								<FormGroup>
									<Label for="rows">Number of Rows:</Label>
									<InputRange id="rows" minValue={5} maxValue={50} value={this.state.rows} onChange={rows => this.setState({ rows })} onChangeComplete={() => this.randomize()}/>
								</FormGroup>
								<FormGroup>
									<Label for="columns">Number of Columns:</Label>
									<InputRange id="columns" minValue={5} maxValue={50} value={this.state.columns} onChange={columns => this.setState({ columns })} onChangeComplete={() => this.randomize()}/>
								</FormGroup>
								<FormGroup check>
									<Label for="birth">Neighbours required for Birth:</Label>
									<div>
										{[1,2,3,4,5,6,7,8].map((number) =>
											<Label key={number} className="checkbox-style" check>
												<Input type='checkbox' data-rule={'birth' + number} checked={this.state["birth" + number]} onChange={this.handleChecked}/> {number}
											</Label>
										)}
									</div>
								</FormGroup>
								<FormGroup check>
									<Label for="survival">Neighbours required for Cell Survival:</Label>
									<div>
										{[1,2,3,4,5,6,7,8].map((number) =>
											<Label key={number} className="checkbox-style" check>
												<Input type='checkbox' data-rule={'survival' + number} checked={this.state["survival" + number]} onChange={this.handleChecked}/> {number}
											</Label>
										)}
									</div>
								</FormGroup>
								<FormGroup>
									<Label for="fps">Animation speed (fps):</Label>
									<InputRange id="fps" minValue={1} maxValue={20} value={this.state.fps} onChange={fps => this.setState({ fps })}/>
								</FormGroup>
							</CardBlock>
							{
								// Control buttons
							}
							<CardBlock>
								<Button color="secondary" className="spaced-buttons" onMouseDown={e => e.preventDefault()} onClick={this.clearBoard}>Clear</Button>
								<Button color="secondary" className="spaced-buttons" onMouseDown={e => e.preventDefault()} onClick={this.randomize}>Randomize</Button>
								<Button color={this.state.running ? 'danger' : 'success'} className="spaced-buttons" onClick={this.handleRun}>{this.state.running ? 'Stop' : 'Start'}</Button>
							</CardBlock>
							{
								// This is where the status information is displayed
							}
							<CardBlock>
								{this.state.running &&
									<Alert>Current generation: {this.state.currentGeneration}</Alert>
								}
								{!this.state.running && this.state.exitReason &&
									<Alert>{this.state.exitReason}</Alert>
								}
							</CardBlock>
						</Card>
					</Col>
					{
						// The second column displays the board where the pixels live out their short and meaningless lives
					}
					<Col  md="8" sm="12" className="spaced">
						<Card>
							<CardBlock>
								<LifeBoard rows={this.state.rows} columns={this.state.columns} selection={this.state.selection} handleCellClicked={this.handleCellClicked}/>
							</CardBlock>
						</Card>
					</Col>
				</Row>
			</Container>
		);
	}
}

export default App;
