import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Component to display the play board for the game of life simulation.
 */
export default class LifeBoard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			width: 100
		};
	}
		
	
    /**
     * Listen to resize events so we can redraw with appropriate cell sizes.
     */
    componentDidMount() {
      this.updateDimensions();
      window.addEventListener("resize", this.updateDimensions.bind(this));
    }

    /**
     * Remove event listener for resize events
     */
    componentWillUnmount() {
      window.removeEventListener("resize", this.updateDimensions.bind(this));
    }
	
	/**
	 * Called whenever the size of the grid area changes
	 */
    updateDimensions() {
		const myNode = ReactDOM.findDOMNode(this);
		let width = myNode.getBoundingClientRect().width;
		
		this.setState({width});
    }
	
	render() {
		let svgStyle = {
			width: '100%',
			height: this.state.width * this.props.rows / this.props.columns,
			position:'relative',
			top:'0px',
			left:'0px',
			background:'yellow'
		}
		
		// Build an array of Cell components to be drawn by the Cell class below
		let cellLength = this.state.width / this.props.columns;
		let cells = [];
		for (let row=0; row<this.props.rows; row++) {
			for (let col=0; col<this.props.columns; col++) {
				cells.push(
					<Cell
						dim={cellLength} col={col} row={row}
						key={row + ',' + col}
						fill={this.props.selection[[row,col]] ? 'black': 'white'}
						handleCellClicked={this.props.handleCellClicked}
					/>
				);
			}
		}
		
		return (
			<svg style = {svgStyle}>
				{cells}
			</svg>
		);
	}
}

/**
 * The cell class handles both drawing of a cell and handling clicks so they can be passed back up
 * the hierarchy to update the state of the board.
 */
class Cell extends React.Component {
	constructor(props) {
		super(props);

		this.handleCellClicked = this.handleCellClicked.bind(this);
	}
	
    handleCellClicked() {
      this.props.handleCellClicked(this.props.row, this.props.col);
    }

    render() {
      var dim = this.props.dim;
      return (
        <rect
        width={dim} height={dim} fill={this.props.fill}
        stroke='#aaaaaa' strokeWidth='0.5'
        x={dim*this.props.col} y={dim*this.props.row}
        onClick={this.handleCellClicked}>
        </rect>
      );
    }
	
}